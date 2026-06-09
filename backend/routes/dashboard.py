from fastapi import APIRouter, HTTPException
from firebase_admin_init import get_db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _badge_from_points(points: int) -> str:
    if points >= 2500: return "Master"
    if points >= 1501: return "Platinum"
    if points >= 1001: return "Diamond"
    if points >= 501:  return "Gold"
    if points >= 251:  return "Silver"
    return "Bronze"


@router.get("/{uid}")
async def get_dashboard_data(uid: str):
    """Get dashboard data from Firestore collections."""
    try:
        db = get_db()

        # ── User profile ──────────────────────────────────────────────────────
        user_doc = db.collection("users").document(uid).get()
        user_data = user_doc.to_dict() if user_doc.exists else {}

        # ── Latest analysis session (sort in Python — no composite index needed)
        raw_sessions = (
            db.collection("analysis_sessions")
            .where(filter=FieldFilter("uid", "==", uid))
            .where(filter=FieldFilter("status", "==", "completed"))
            .limit(10)
            .stream()
        )
        sessions = sorted(
            [d.to_dict() for d in raw_sessions],
            key=lambda x: x.get("createdAt") or 0,
            reverse=True,
        )
        latest_analysis = sessions[0] if sessions else None

        print(f"[Dashboard] uid={uid} | found {len(sessions)} sessions | latest atsScore={latest_analysis.get('atsScore') if latest_analysis else 'N/A'}")

        # ── Roadmaps ──────────────────────────────────────────────────────────
        roadmap_docs = list(
            db.collection("roadmaps")
            .where(filter=FieldFilter("uid", "==", uid))
            .stream()
        )
        roadmaps = []
        total_progress = 0
        for doc in roadmap_docs:
            data = doc.to_dict()
            completed_count = len(data.get("completedTopics", []))
            roadmaps.append({
                "role": data.get("role", ""),
                "progress": data.get("progressPercentage", 0),
                "completed": completed_count,
                "total": len(data.get("roadmap", [])),
                "roadmap": data.get("roadmap", [])[:4],
            })
            total_progress += data.get("progressPercentage", 0)

        active_roadmap = max(roadmaps, key=lambda x: x["progress"]) if roadmaps else None
        avg_progress = total_progress / len(roadmaps) if roadmaps else 0

        # ── Profile completion ────────────────────────────────────────────────
        fields = [
            user_data.get("name"),
            user_data.get("email"),
            user_data.get("photo_url"),
            user_data.get("college"),
            user_data.get("resume_url"),
            latest_analysis,
        ]
        profile_completion = int(sum(1 for f in fields if f) / len(fields) * 100)

        # ── Points & badge ────────────────────────────────────────────────────
        progress_doc = db.collection("user_progress").document(uid).get()
        progress_data = progress_doc.to_dict() if progress_doc.exists else {}
        total_points = progress_data.get("totalPoints", 0)
        badge_level = progress_data.get("badge") or _badge_from_points(total_points)

        print(f"[Dashboard] total_points={total_points} badge={badge_level} profile_completion={profile_completion}%")

        # ── Recent activities ─────────────────────────────────────────────────
        activities = []
        if latest_analysis:
            activities.append({
                "text": f"Resume analyzed — ATS score: {latest_analysis.get('atsScore', 0)}/100",
                "time": "Latest",
                "icon": "📄",
            })
        if active_roadmap and active_roadmap["completed"] > 0:
            activities.append({
                "text": f"Completed {active_roadmap['completed']} topics in {active_roadmap['role']}",
                "time": "In progress",
                "icon": "📅",
            })
        career_doc = db.collection("career_paths").document(uid).get()
        if career_doc.exists:
            selected_role = career_doc.to_dict().get("selectedRole", "")
            if selected_role:
                activities.append({"text": f"Selected career path: {selected_role}", "time": "Recent", "icon": "🛣️"})
        if total_points > 0:
            activities.append({"text": f"{badge_level} badge — {total_points} total points", "time": "Updated", "icon": "🏅"})
        if not activities:
            activities = [
                {"text": "Welcome to VidyaGuide AI!", "time": "Today", "icon": "🎉"},
                {"text": "Complete your resume analysis to get started", "time": "", "icon": "📄"},
            ]

        # ── Skills overview ───────────────────────────────────────────────────
        skills_overview = []
        if latest_analysis:
            ats = latest_analysis.get("atsScore", 70)
            colors = ["var(--color-dash-blue)", "var(--color-dash-purple)",
                      "var(--color-dash-green)", "var(--color-dash-gold)",
                      "var(--color-dash-red)"]
            matched = latest_analysis.get("matchedSkills", [])
            missing = latest_analysis.get("missingSkills", [])
            # Show top matched skills with deterministic % based on ATS score
            for i, skill in enumerate(matched[:5]):
                # Deterministic: use hash of skill name so it doesn't change on reload
                offset = (hash(skill) % 21) - 10  # -10 to +10
                pct = max(50, min(100, ats + offset))
                skills_overview.append({"name": skill, "percent": pct, "color": colors[i % len(colors)], "status": "matched"})
            # Show top missing skills at lower %
            for i, skill in enumerate(missing[:3]):
                offset = (hash(skill) % 21) - 10
                pct = max(10, min(45, 40 + offset))
                skills_overview.append({"name": skill, "percent": pct, "color": "var(--color-dash-red)", "status": "missing"})

        if not skills_overview:
            skills_overview = [
                {"name": "Communication", "percent": 75, "color": "var(--color-dash-blue)", "status": "matched"},
                {"name": "Problem Solving", "percent": 80, "color": "var(--color-dash-purple)", "status": "matched"},
            ]

        return {
            "ats_score": latest_analysis.get("atsScore", 0) if latest_analysis else 0,
            "match_percentage": latest_analysis.get("matchPercentage", 0) if latest_analysis else 0,
            "profile_completion": profile_completion,
            "total_points": total_points,
            "badge_level": badge_level,
            "roadmap_progress": round(avg_progress, 1),
            "active_roadmap": active_roadmap,
            "recent_activities": activities,
            "skills_overview": skills_overview,
            "has_analysis": latest_analysis is not None,
            "has_roadmaps": len(roadmaps) > 0,
        }

    except Exception as e:
        print(f"[Dashboard] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))