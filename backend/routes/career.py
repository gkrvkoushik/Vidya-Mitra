from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agent.nodes import _parse_json
from agent.llm import get_llm
from firebase_admin_init import get_db
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/api/career", tags=["Career Paths"])


class CareerRequest(BaseModel):
    uid: str
    skills: List[str] = []
    education: str = ""
    experience: List[str] = []


class CustomRoleRequest(BaseModel):
    uid: str
    role: str
    skills: List[str] = []
    education: str = ""
    experience: List[str] = []


class RoleSelectRequest(BaseModel):
    uid: str
    selected_role: str


def _get_skills_context(uid: str, fallback_skills: List[str]) -> dict:
    """Fetch latest analysis session skills from Firestore."""
    try:
        db = get_db()
        docs = (
            db.collection("analysis_sessions")
            .where(filter=FieldFilter("uid", "==", uid))
            .where(filter=FieldFilter("status", "==", "completed"))
            .limit(5)
            .stream()
        )
        sessions = sorted(
            [d.to_dict() for d in docs],
            key=lambda x: x.get("createdAt") or 0,
            reverse=True,
        )
        if sessions:
            latest = sessions[0]
            return {
                "skills": latest.get("matchedSkills", []) or fallback_skills,
                "missing_skills": latest.get("missingSkills", []),
                "ats_score": latest.get("atsScore", 0),
                "match_percentage": latest.get("matchPercentage", 0),
                "session_id": latest.get("sessionId", ""),
            }
    except Exception as e:
        print(f"[career] _get_skills_context error: {e}")
    return {"skills": fallback_skills, "missing_skills": [], "ats_score": 0, "match_percentage": 0, "session_id": ""}


@router.post("/recommend")
async def recommend_careers(req: CareerRequest):
    try:
        ctx = _get_skills_context(req.uid, req.skills)
        
        # Check if we already have recommendations based on current analysis session
        db = get_db()
        career_doc = db.collection("career_paths").document(req.uid).get()
        
        if career_doc.exists:
            existing_data = career_doc.to_dict()
            existing_session = existing_data.get("sessionId", "")
            current_session = ctx.get("session_id", "")
            
            # Only generate new recommendations if we have a new analysis session
            if existing_session == current_session and existing_session:
                return {
                    "recommended_roles": existing_data.get("recommendedRoles", []),
                    "skills_context": ctx["skills"],
                    "missing_skills_context": ctx["missing_skills"]
                }
        
        # Generate new career recommendations using LLM
        llm = get_llm()
        prompt = f"""Analyze career paths for a candidate with these skills:

Current Skills: {ctx['skills']}
Skill Gaps: {ctx['missing_skills']}
Education: {req.education}

Recommend 4-5 suitable career roles. Return ONLY valid JSON:
{{
  "recommended_roles": [
    {{
      "title": "Software Engineer",
      "match_percentage": 85,
      "salary_range": "$80K - $120K",
      "reason": "Strong technical foundation aligns well",
      "certifications": ["AWS Certified", "Google Cloud"]
    }}
  ]
}}"""
        
        response = llm.invoke(prompt)
        career_data = _parse_json(response.content)
        roles = career_data.get("recommended_roles", [])

        db.collection("career_paths").document(req.uid).set({
            "uid": req.uid,
            "recommendedRoles": roles,
            "selectedRole": "",
            "skillsContext": ctx["skills"],
            "missingSkillsContext": ctx["missing_skills"],
            "sessionId": ctx.get("session_id", ""),
            "generatedAt": SERVER_TIMESTAMP,
        })
        return {"recommended_roles": roles, "skills_context": ctx["skills"], "missing_skills_context": ctx["missing_skills"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/custom")
async def custom_career_path(req: CustomRoleRequest):
    """Generate career path analysis for a user-specified role."""
    try:
        ctx = _get_skills_context(req.uid, req.skills)
        llm = get_llm()
        prompt = f"""Analyze a candidate's fit for the role: "{req.role}"

Candidate profile:
- Current Skills: {ctx['skills']}
- Missing Skills (from last resume analysis): {ctx['missing_skills']}
- Education: {req.education}

Return ONLY valid JSON with keys:
- title (string, the role name)
- match_percentage (int 0-100, how well candidate fits this role right now)
- salary_range (string)
- certifications (list of 3-5 recommended certifications)
- reason (string, why this role suits the candidate)
- skill_status (list of objects: each with skill (string), have (bool), importance ("must-have"|"nice-to-have"))
- next_steps (list of 3 actionable strings to bridge the gap)
"""
        response = llm.invoke(prompt)
        parsed = _parse_json(response.content)

        role_data = {
            "title": parsed.get("title", req.role),
            "match_percentage": parsed.get("match_percentage", 0),
            "salary_range": parsed.get("salary_range", ""),
            "certifications": parsed.get("certifications", []),
            "reason": parsed.get("reason", ""),
            "skill_status": parsed.get("skill_status", []),
            "next_steps": parsed.get("next_steps", []),
            "is_custom": True,
        }
        return {"role": role_data, "skills_context": ctx["skills"], "missing_skills_context": ctx["missing_skills"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/select-role")
async def select_role(req: RoleSelectRequest):
    try:
        db = get_db()
        db.collection("career_paths").document(req.uid).set(
            {"selectedRole": req.selected_role}, merge=True
        )
        return {"status": "ok", "selected_role": req.selected_role}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context/{uid}")
async def get_skills_context(uid: str):
    """Return the skills context from latest resume analysis."""
    try:
        ctx = _get_skills_context(uid, [])
        return ctx
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{uid}")
async def get_career_paths(uid: str):
    try:
        db = get_db()
        doc = db.collection("career_paths").document(uid).get()
        if not doc.exists:
            return {"recommended_roles": [], "selected_role": "", "skills_context": [], "missing_skills_context": []}
        data = doc.to_dict()
        data["skills_context"] = data.pop("skillsContext", [])
        data["missing_skills_context"] = data.pop("missingSkillsContext", [])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
