import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from firebase_admin_init import get_db
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.cloud.firestore_v1.base_query import FieldFilter
from agent.graph import interview_question_graph, interview_eval_graph, interview_report_graph

router = APIRouter(prefix="/api/interview", tags=["Mock Interview"])


# ── Request models ─────────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    uid: str
    role: str
    skills: List[str] = []
    missing_skills: List[str] = []
    resume_summary: str = ""
    experience_years: int = 0
    total_questions: int = 5
    force_scenario: bool = True


class AnswerRequest(BaseModel):
    uid: str
    session_id: str
    answer: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def _session_ref(session_id: str):
    return get_db().collection("interview_sessions").document(session_id)


def _load_state(session_id: str) -> dict:
    doc = _session_ref(session_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return doc.to_dict()


def _save_state(session_id: str, data: dict):
    _session_ref(session_id).set(data, merge=True)


def _get_candidate_context(uid: str) -> dict:
    db = get_db()
    ctx = {"skills": [], "missing_skills": [], "role": "", "resume_summary": "", "experience_years": 0}
    try:
        sessions = list(
            db.collection("analysis_sessions")
            .where(filter=FieldFilter("uid", "==", uid))
            .where(filter=FieldFilter("status", "==", "completed"))
            .limit(10)
            .stream()
        )
        if sessions:
            latest = sorted([d.to_dict() for d in sessions],
                            key=lambda x: x.get("createdAt") or 0, reverse=True)[0]
            ctx["skills"] = latest.get("matchedSkills", [])
            ctx["missing_skills"] = latest.get("missingSkills", [])

        cp = db.collection("career_paths").document(uid).get()
        if cp.exists:
            ctx["role"] = cp.to_dict().get("selectedRole", "")

        user = db.collection("users").document(uid).get()
        if user.exists:
            ctx["experience_years"] = user.to_dict().get("experience_years", 0)
    except Exception as e:
        print(f"[Interview] context load error: {e}")
    return ctx


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/context/{uid}")
async def get_context(uid: str):
    return _get_candidate_context(uid)


@router.post("/start")
async def start_interview(req: StartRequest):
    session_id = str(uuid.uuid4())
    try:
        initial_state = {
            "uid": req.uid,
            "session_id": session_id,
            "role": req.role,
            "skills": req.skills,
            "missing_skills": req.missing_skills,
            "resume_summary": req.resume_summary,
            "experience_years": req.experience_years,
            "total_questions": req.total_questions,
            "force_scenario": req.force_scenario,
            "question_number": 0,
            "difficulty": "Intermediate",
            "asked_questions": [],
            "interview_history": [],
            "technical_score": 0.0,
            "communication_score": 0.0,
            "confidence_score": 0.0,
            "completeness_score": 0.0,
            "overall_score": 0.0,
            "current_question": {},
            "current_answer": "",
        }

        result = interview_question_graph.invoke(initial_state)

        _save_state(session_id, {
            **result,
            "status": "active",
            "startedAt": SERVER_TIMESTAMP,
            "totalQuestions": req.total_questions,
        })

        return {
            "session_id": session_id,
            "question": result["current_question"],
            "question_number": 1,
            "total_questions": req.total_questions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/answer")
async def submit_answer(req: AnswerRequest):
    try:
        state = _load_state(req.session_id)
        state["current_answer"] = req.answer

        result = interview_eval_graph.invoke(state)
        history = result.get("interview_history", [])
        last_entry = history[-1] if history else {}
        q_number = result.get("question_number", 0)
        total_q = state.get("totalQuestions", state.get("total_questions", 5))
        is_complete = q_number >= total_q

        if is_complete:
            result = interview_report_graph.invoke(result)
            _save_state(req.session_id, {
                **result,
                "status": "completed",
                "completedAt": SERVER_TIMESTAMP,
                "interviewHistory": result.get("interview_history", []),
                "technicalAverage": result.get("technical_score", 0),
                "communicationAverage": result.get("communication_score", 0),
                "completenessAverage": result.get("completeness_score", 0),
                "confidenceAverage": result.get("confidence_score", 0),
                "overallScore": result.get("overall_score", 0),
                "strengths": result.get("strengths", []),
                "weaknesses": result.get("weaknesses", []),
                "recommendations": result.get("recommendations", []),
                "hiringRecommendation": result.get("hiring_recommendation", "Borderline"),
            })
            return {
                "evaluation": last_entry,
                "is_complete": True,
                "session_id": req.session_id,
                "overall_score": result.get("overall_score", 0),
                "hiring_recommendation": result.get("hiring_recommendation", "Borderline"),
            }

        next_result = interview_question_graph.invoke(result)
        _save_state(req.session_id, {
            **next_result,
            "interviewHistory": next_result.get("interview_history", []),
            "technicalAverage": next_result.get("technical_score", 0),
            "communicationAverage": next_result.get("communication_score", 0),
            "completenessAverage": next_result.get("completeness_score", 0),
            "confidenceAverage": next_result.get("confidence_score", 0),
            "overallScore": next_result.get("overall_score", 0),
        })

        return {
            "evaluation": last_entry,
            "next_question": next_result.get("current_question", {}),
            "question_number": q_number + 1,
            "total_questions": total_q,
            "is_complete": False,
            "running_scores": {
                "technical": next_result.get("technical_score", 0),
                "communication": next_result.get("communication_score", 0),
                "confidence": next_result.get("confidence_score", 0),
                "completeness": next_result.get("completeness_score", 0),
                "overall": next_result.get("overall_score", 0),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{session_id}")
async def get_report(session_id: str):
    state = _load_state(session_id)
    # Accept both completed and active sessions — active means force-ended
    if state.get("status") not in ("completed", "active"):
        raise HTTPException(status_code=400, detail="Interview session not found or invalid.")
    # If still active (force-ended mid-session), generate report on the fly
    if state.get("status") == "active":
        try:
            result = interview_report_graph.invoke(state)
            _save_state(session_id, {
                "status": "completed",
                "completedAt": SERVER_TIMESTAMP,
                "interviewHistory": result.get("interview_history", []),
                "technicalAverage": result.get("technical_score", 0),
                "communicationAverage": result.get("communication_score", 0),
                "completenessAverage": result.get("completeness_score", 0),
                "confidenceAverage": result.get("confidence_score", 0),
                "overallScore": result.get("overall_score", 0),
                "strengths": result.get("strengths", []),
                "weaknesses": result.get("weaknesses", []),
                "recommendations": result.get("recommendations", []),
                "hiringRecommendation": result.get("hiring_recommendation", "Borderline"),
            })
            state = {**state, **result,
                "status": "completed",
                "technicalAverage": result.get("technical_score", 0),
                "communicationAverage": result.get("communication_score", 0),
                "completenessAverage": result.get("completeness_score", 0),
                "confidenceAverage": result.get("confidence_score", 0),
                "overallScore": result.get("overall_score", 0),
                "hiringRecommendation": result.get("hiring_recommendation", "Borderline"),
            }
        except Exception as e:
            print(f"[Report] on-the-fly generation failed: {e}")
    return {
        "session_id": session_id,
        "uid": state.get("uid"),
        "role": state.get("role"),
        "started_at": state.get("startedAt"),
        "completed_at": state.get("completedAt"),
        "overall_score": state.get("overallScore", 0),
        "technical_average": state.get("technicalAverage", 0),
        "communication_average": state.get("communicationAverage", 0),
        "completeness_average": state.get("completenessAverage", 0),
        "confidence_average": state.get("confidenceAverage", 0),
        "hiring_recommendation": state.get("hiringRecommendation", "Borderline"),
        "strengths": state.get("strengths", []),
        "weaknesses": state.get("weaknesses", []),
        "recommendations": state.get("recommendations", []),
        "interview_history": state.get("interviewHistory", state.get("interview_history", [])),
        "total_questions": state.get("totalQuestions", 5),
    }


@router.get("/history/{uid}")
async def get_history(uid: str):
    try:
        db = get_db()
        docs = list(
            db.collection("interview_sessions")
            .where(filter=FieldFilter("uid", "==", uid))
            .limit(20)
            .stream()
        )
        sessions = sorted(
            [d.to_dict() for d in docs],
            key=lambda x: x.get("startedAt") or x.get("createdAt") or 0,
            reverse=True,
        )
        return {
            "sessions": [
                {
                    "session_id": s.get("session_id", ""),
                    "role": s.get("role", ""),
                    "status": s.get("status", ""),
                    "overall_score": s.get("overallScore", 0),
                    "hiring_recommendation": s.get("hiringRecommendation", ""),
                    "total_questions": s.get("totalQuestions", 5),
                    "started_at": s.get("startedAt"),
                    "completed_at": s.get("completedAt"),
                }
                for s in sessions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
