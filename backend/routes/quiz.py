from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from agent.graph import quiz_graph, quiz_eval_graph
from firebase_admin_init import get_db
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

BADGE_THRESHOLDS = [
    (2500, "Master"), (1501, "Platinum"), (1001, "Diamond"),
    (501, "Gold"), (251, "Silver"), (0, "Bronze"),
]


def compute_badge(points: int) -> str:
    for threshold, badge in BADGE_THRESHOLDS:
        if points >= threshold:
            return badge
    return "Bronze"


class QuizGenerateRequest(BaseModel):
    uid: str
    skill: str
    difficulty: str = "Medium"


class QuizSubmitRequest(BaseModel):
    uid: str
    skill: str
    difficulty: str
    questions: List[dict]
    answers: List[int]   # -1 = unattempted


@router.post("/generate")
async def generate_quiz(req: QuizGenerateRequest):
    try:
        result = quiz_graph.invoke({
            "uid": req.uid,
            "quiz_skill": req.skill,
            "quiz_difficulty": req.difficulty,
        })
        return {
            "questions": result.get("quiz_questions", []),
            "skill": req.skill,
            "difficulty": req.difficulty,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_quiz(req: QuizSubmitRequest):
    try:
        db = get_db()

        # Get current points
        progress_ref = db.collection("user_progress").document(req.uid)
        progress_doc = progress_ref.get()
        current_points = progress_doc.to_dict().get("totalPoints", 0) if progress_doc.exists else 0

        # Evaluate via LangGraph
        result = quiz_eval_graph.invoke({
            "uid": req.uid,
            "quiz_skill": req.skill,
            "quiz_difficulty": req.difficulty,
            "quiz_questions": req.questions,
            "quiz_answers": req.answers,
            "total_points": current_points,
        })

        quiz_res = result.get("quiz_results", {})
        points_earned = quiz_res.get("points_earned", 0)
        new_total = current_points + points_earned
        badge = compute_badge(new_total)

        # Save quiz result
        db.collection("quiz_results").add({
            "uid": req.uid,
            "skill": req.skill,
            "difficulty": req.difficulty,
            "correctAnswers": quiz_res.get("correct", 0),
            "wrongAnswers": quiz_res.get("wrong", 0),
            "unattempted": quiz_res.get("unattempted", 0),
            "score": quiz_res.get("score_percentage", 0),
            "pointsEarned": points_earned,
            "createdAt": SERVER_TIMESTAMP,
        })

        # Update user_progress
        quizzes_attempted = (progress_doc.to_dict().get("quizzesAttempted", 0) if progress_doc.exists else 0) + 1
        progress_ref.set({
            "uid": req.uid,
            "totalPoints": new_total,
            "badge": badge,
            "quizzesAttempted": quizzes_attempted,
            "updatedAt": SERVER_TIMESTAMP,
        }, merge=True)

        return {
            "correct": quiz_res.get("correct", 0),
            "wrong": quiz_res.get("wrong", 0),
            "unattempted": quiz_res.get("unattempted", 0),
            "score_percentage": quiz_res.get("score_percentage", 0),
            "points_earned": points_earned,
            "total_points": new_total,
            "badge": badge,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{uid}")
async def get_quiz_history(uid: str):
    try:
        db = get_db()
        # Use filter= keyword to silence deprecation warning
        from google.cloud.firestore_v1.base_query import FieldFilter
        docs = (
            db.collection("quiz_results")
            .where(filter=FieldFilter("uid", "==", uid))
            .limit(20)
            .stream()
        )
        results = sorted(
            [d.to_dict() for d in docs],
            key=lambda x: x.get("createdAt") or 0,
            reverse=True,
        )
        return {"history": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
