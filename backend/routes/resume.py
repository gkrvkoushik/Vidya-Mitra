import uuid
import httpx
from io import BytesIO
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pypdf import PdfReader
from agent.graph import analysis_graph

router = APIRouter(prefix="/api/resume", tags=["Resume Analysis"])


class AnalyzeRequest(BaseModel):
    uid: str
    resume_url: str
    resume_text: str        # frontend-extracted text (fallback)
    job_description: str


async def _extract_text_from_url(url: str) -> str:
    """Download PDF from Cloudinary and extract text using pypdf."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    reader = PdfReader(BytesIO(resp.content))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + "\n"
    return text.strip()


@router.post("/analyze")
async def analyze_resume(req: AnalyzeRequest):
    session_id = str(uuid.uuid4())
    try:
        # Always try backend PDF extraction from Cloudinary URL first
        resume_text = ""
        if req.resume_url:
            try:
                resume_text = await _extract_text_from_url(req.resume_url)
                print(f"[/analyze] Backend PDF extraction: {len(resume_text)} chars")
                print(f"[/analyze] First 300 chars:\n{resume_text[:300]}\n")
            except Exception as e:
                print(f"[/analyze] Backend PDF extraction failed: {e}")

        # Fallback to frontend-extracted text if backend extraction got nothing useful
        if len(resume_text) < 50 and len(req.resume_text) > 50:
            resume_text = req.resume_text
            print(f"[/analyze] Using frontend-extracted text: {len(resume_text)} chars")

        if len(resume_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from resume. Ensure the PDF contains selectable text (not a scanned image)."
            )

        result = analysis_graph.invoke({
            "uid": req.uid,
            "session_id": session_id,
            "resume_url": req.resume_url,
            "resume_text": resume_text,
            "job_description": req.job_description,
        })
        return {
            "session_id": session_id,
            "ats_score": result.get("ats_score", 0),
            "match_percentage": result.get("match_percentage", 0),
            "matched_skills": result.get("matched_skills", []),
            "missing_skills": result.get("missing_skills", []),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "recommendations": result.get("recommendations", []),
            "skills": result.get("skills", []),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
