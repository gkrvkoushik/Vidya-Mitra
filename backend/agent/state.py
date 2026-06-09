from typing import TypedDict, Optional, List, Dict, Any


class CareerState(TypedDict, total=False):
    uid: str
    session_id: str
    profile: Dict[str, Any]
    resume_url: str
    resume_text: str
    job_description: str
    jd_parsed: Dict[str, Any]
    ats_score: int
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    matched_preferred: List[str]
    missing_preferred: List[str]
    matched_required_count: int
    total_required_count: int
    matched_preferred_count: int
    total_preferred_count: int
    education_score: float
    experience_score: float
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    skills: List[str]
    recommended_roles: List[Dict[str, Any]]
    selected_role: str
    roadmap: List[Dict[str, Any]]
    roadmap_weeks: int
    learning_pace: str
    quiz_questions: List[Dict[str, Any]]
    quiz_skill: str
    quiz_difficulty: str
    quiz_answers: List[int]
    quiz_results: Dict[str, Any]
    total_points: int
    badge: str
    error: Optional[str]


class InterviewState(TypedDict, total=False):
    uid: str
    session_id: str
    role: str
    resume_summary: str
    skills: List[str]
    missing_skills: List[str]
    experience_years: int
    # current turn
    current_question: Dict[str, Any]
    current_answer: str
    question_number: int
    difficulty: str          # Beginner | Intermediate | Advanced
    asked_questions: List[str]
    # session config
    total_questions: int
    force_scenario: bool
    # history
    interview_history: List[Dict[str, Any]]
    # scores (running averages)
    technical_score: float
    communication_score: float
    confidence_score: float
    completeness_score: float
    overall_score: float
    # report
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    hiring_recommendation: str
    error: Optional[str]
