from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agent.graph import roadmap_graph
from agent.nodes import _parse_json
from firebase_admin_init import get_db
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])

PACE_WEEKS = {"Slow": 12, "Moderate": 8, "Fast": 5}


class RoadmapRequest(BaseModel):
    uid: str
    selected_role: str
    missing_skills: List[str] = []
    current_skills: List[str] = []
    learning_pace: str = "Moderate"  # Slow | Moderate | Fast


class TopicCompleteRequest(BaseModel):
    uid: str
    topic: str
    role: Optional[str] = None


def _doc_key(uid: str, role: str) -> str:
    safe = role.lower().replace(" ", "_")[:40]
    return f"{uid}_{safe}"


def _get_skills_context(uid: str) -> dict:
    """Pull skills from latest completed analysis session.
    Two-stage: with status filter first, fallback to uid-only query.
    """
    db = get_db()

    def _pick_latest(docs_iter):
        rows = [d.to_dict() for d in docs_iter]
        return sorted(rows, key=lambda x: x.get("createdAt") or 0, reverse=True)[0] if rows else None

    try:
        # Stage 1 — uid + status (composite index)
        latest = _pick_latest(
            db.collection("analysis_sessions")
            .where(filter=FieldFilter("uid", "==", uid))
            .where(filter=FieldFilter("status", "==", "completed"))
            .limit(10)
            .stream()
        )
        # Stage 2 — uid only (single-field index, always works)
        if not latest:
            latest = _pick_latest(
                db.collection("analysis_sessions")
                .where(filter=FieldFilter("uid", "==", uid))
                .limit(10)
                .stream()
            )
        if latest:
            matched = latest.get("matchedSkills") or []
            preferred = latest.get("matchedPreferred") or []
            return {
                "skills": list(dict.fromkeys(matched + preferred)),
                "missing_skills": latest.get("missingSkills") or [],
            }
    except Exception as e:
        print(f"[roadmap] _get_skills_context error: {e}")
    return {"skills": [], "missing_skills": []}


@router.post("/generate")
async def generate_roadmap(req: RoadmapRequest):
    try:
        ctx = _get_skills_context(req.uid)
        current_skills = req.current_skills if req.current_skills else ctx["skills"]
        missing_skills = req.missing_skills if req.missing_skills else ctx["missing_skills"]
        weeks = PACE_WEEKS.get(req.learning_pace, 8)

        if not missing_skills and not current_skills:
            raise HTTPException(status_code=400, detail="No skills context found. Please complete a resume analysis first.")

        # Route through the agent's roadmap_node — not a raw LLM call
        result = roadmap_graph.invoke({
            "selected_role": req.selected_role,
            "skills": current_skills,
            "missing_skills": missing_skills,
            "roadmap_weeks": weeks,
        })

        roadmap = result.get("roadmap", [])
        if not roadmap:
            raise HTTPException(status_code=500, detail="Agent returned an empty roadmap. Please try again.")

        doc_key = _doc_key(req.uid, req.selected_role)
        db = get_db()
        db.collection("roadmaps").document(doc_key).set({
            "uid": req.uid,
            "role": req.selected_role,
            "learningPace": req.learning_pace,
            "roadmap": roadmap,
            "progressPercentage": 0,
            "completedTopics": [],
            "currentSkills": current_skills,
            "missingSkills": missing_skills,
            "generatedAt": SERVER_TIMESTAMP,
        })
        return {
            "roadmap": roadmap,
            "role": req.selected_role,
            "learning_pace": req.learning_pace,
            "current_skills": current_skills,
            "missing_skills": missing_skills,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all/{uid}")
async def get_all_roadmaps(uid: str):
    """Return lightweight list of all roadmaps without expensive skill alignment."""
    try:
        db = get_db()
        docs = list(
            db.collection("roadmaps")
            .where(filter=FieldFilter("uid", "==", uid))
            .stream()
        )
        results = []
        
        for d in docs:
            data = d.to_dict()
            roadmap = data.get("roadmap", [])
            
            results.append({
                "doc_id": d.id,
                "role": data.get("role", ""),
                "learning_pace": data.get("learningPace", "Moderate"),
                "progress_percentage": data.get("progressPercentage", 0),
                "completed_topics": data.get("completedTopics", []),
                "total_weeks": len(roadmap),
                "roadmap": roadmap,  # Return full roadmap as stored
                "current_skills": data.get("currentSkills", []),
                "missing_skills": data.get("missingSkills", []),
                "generated_at": data.get("generatedAt"),
            })
        return {"roadmaps": sorted(results, key=lambda x: x["role"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{uid}")
async def get_roadmap(uid: str, role: Optional[str] = None):
    """Get roadmap for uid. If role query param provided, get that role's roadmap."""
    try:
        db = get_db()
        if role:
            doc = db.collection("roadmaps").document(_doc_key(uid, role)).get()
        else:
            # fallback: get selected role from career_paths
            cp = db.collection("career_paths").document(uid).get()
            selected = cp.to_dict().get("selectedRole", "") if cp.exists else ""
            if selected:
                doc = db.collection("roadmaps").document(_doc_key(uid, selected)).get()
            else:
                doc = None

        if not doc or not doc.exists:
            return {"roadmap": [], "progress_percentage": 0, "completed_topics": [], "role": role or "", "learning_pace": "Moderate"}

        data = doc.to_dict()
        return {
            "roadmap": data.get("roadmap", []),
            "role": data.get("role", ""),
            "learning_pace": data.get("learningPace", "Moderate"),
            "progress_percentage": data.get("progressPercentage", 0),
            "completed_topics": data.get("completedTopics", []),
            "current_skills": data.get("currentSkills", []),
            "missing_skills": data.get("missingSkills", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete")
async def delete_roadmap(uid: str, role: str):
    """Delete a specific roadmap permanently."""
    try:
        db = get_db()
        doc_key = _doc_key(uid, role)
        ref = db.collection("roadmaps").document(doc_key)
        
        if not ref.get().exists:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        ref.delete()
        return {"message": f"Roadmap '{role}' deleted successfully", "deleted_role": role}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complete-topic")
async def complete_topic(req: TopicCompleteRequest):
    try:
        db = get_db()
        # Determine doc key
        if req.role:
            doc_key = _doc_key(req.uid, req.role)
        else:
            cp = db.collection("career_paths").document(req.uid).get()
            selected = cp.to_dict().get("selectedRole", "") if cp.exists else ""
            doc_key = _doc_key(req.uid, selected) if selected else req.uid

        ref = db.collection("roadmaps").document(doc_key)
        doc = ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        data = doc.to_dict()
        completed = data.get("completedTopics", [])
        roadmap = data.get("roadmap", [])

        if req.topic in completed:
            completed.remove(req.topic)  # toggle off
        else:
            completed.append(req.topic)  # toggle on

        progress = round(len(completed) / len(roadmap) * 100) if roadmap else 0
        ref.update({"completedTopics": completed, "progressPercentage": progress})
        return {"completed_topics": completed, "progress_percentage": progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
