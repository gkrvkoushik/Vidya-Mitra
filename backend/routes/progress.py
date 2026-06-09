from fastapi import APIRouter, HTTPException
from firebase_admin_init import get_db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.get("/{uid}")
async def get_progress(uid: str):
    try:
        db = get_db()
        doc = db.collection("user_progress").document(uid).get()
        if not doc.exists:
            return {
                "uid": uid,
                "total_points": 0,
                "badge": "Bronze",
                "quizzes_attempted": 0,
                "roadmap_progress": 0,
                "average_score": 0,
            }
        data = doc.to_dict()

        # Compute average score from quiz_results
        quiz_docs = list(
            db.collection("quiz_results")
            .where(filter=FieldFilter("uid", "==", uid))
            .stream()
        )
        avg_score = 0
        if quiz_docs:
            total_score = sum(d.to_dict().get("score", 0) for d in quiz_docs)
            avg_score = round(total_score / len(quiz_docs), 1)

        # Get roadmap progress
        roadmap_doc = db.collection("roadmaps").document(uid).get()
        roadmap_progress = roadmap_doc.to_dict().get("progressPercentage", 0) if roadmap_doc.exists else 0

        return {
            "uid": uid,
            "total_points": data.get("totalPoints", 0),
            "badge": data.get("badge", "Bronze"),
            "quizzes_attempted": data.get("quizzesAttempted", 0),
            "roadmap_progress": roadmap_progress,
            "average_score": avg_score,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
