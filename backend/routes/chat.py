from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from agent.llm import get_llm

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    uid: str
    message: str
    history: List[ChatMessage] = []
    skills_context: dict = {}

@router.post("/send")
async def chat_send(req: ChatRequest):
    llm = get_llm()

    skills = req.skills_context.get("skills", [])
    ats_score = req.skills_context.get("ats_score", "N/A")
    badge = req.skills_context.get("badge_level", "Bronze")
    total_points = req.skills_context.get("total_points", 0)
    active_role = req.skills_context.get("active_role", "")
    roadmap_progress = req.skills_context.get("roadmap_progress", 0)
    missing_skills = req.skills_context.get("missing_skills", [])

    system_prompt = f"""You are Vidya, a personalized AI career mentor on VidyaGuide AI platform.

USER PROFILE:
- Skills: {', '.join(skills) if skills else 'Not analyzed yet'}
- ATS Score: {ats_score}/100
- Badge Level: {badge} ({total_points} points)
- Active Roadmap: {active_role or 'None'}
- Roadmap Progress: {roadmap_progress}%
- Skills to improve: {', '.join(missing_skills) if missing_skills else 'None identified'}

Give concise, personalized advice based on this user's actual profile. Be encouraging and specific.
Keep responses under 3 sentences unless explaining something complex."""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.history[-8:]:  # last 8 messages for context
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    response = llm.invoke(messages)
    return {"reply": response.content}
