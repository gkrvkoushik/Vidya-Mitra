from langgraph.graph import StateGraph, END
from .state import CareerState, InterviewState
from .nodes import (
    resume_parser_node,
    jd_parser_node,
    resume_match_node,
    ats_score_node,
    skill_gap_node,
    recommendation_node,
    save_to_firestore_node,
    career_path_node,
    roadmap_node,
    quiz_generation_node,
    quiz_evaluation_node,
    badge_node,
    progress_node,
)
from .interview_nodes import (
    generate_question_node,
    evaluate_answer_node,
    generate_followup_node,
    generate_report_node,
)


def build_analysis_graph() -> StateGraph:
    """Resume analysis pipeline: Parse → Match → Score → Gap → Recommend → Save."""
    g = StateGraph(CareerState)
    g.add_node("resume_parser", resume_parser_node)
    g.add_node("jd_parser", jd_parser_node)
    g.add_node("resume_match", resume_match_node)
    g.add_node("ats_score", ats_score_node)
    g.add_node("skill_gap", skill_gap_node)
    g.add_node("recommendation", recommendation_node)
    g.add_node("save_firestore", save_to_firestore_node)

    g.set_entry_point("resume_parser")
    g.add_edge("resume_parser", "jd_parser")
    g.add_edge("jd_parser", "resume_match")
    g.add_edge("resume_match", "ats_score")
    g.add_edge("ats_score", "skill_gap")
    g.add_edge("skill_gap", "recommendation")
    g.add_edge("recommendation", "save_firestore")
    g.add_edge("save_firestore", END)
    return g.compile()


def build_career_graph() -> StateGraph:
    """Career path recommendation pipeline."""
    g = StateGraph(CareerState)
    g.add_node("career_path", career_path_node)
    g.set_entry_point("career_path")
    g.add_edge("career_path", END)
    return g.compile()


def build_roadmap_graph() -> StateGraph:
    """Roadmap generation pipeline."""
    g = StateGraph(CareerState)
    g.add_node("roadmap", roadmap_node)
    g.set_entry_point("roadmap")
    g.add_edge("roadmap", END)
    return g.compile()


def build_quiz_graph() -> StateGraph:
    """Quiz generation + evaluation pipeline."""
    g = StateGraph(CareerState)
    g.add_node("quiz_generation", quiz_generation_node)
    g.add_node("quiz_evaluation", quiz_evaluation_node)
    g.add_node("badge", badge_node)
    g.add_node("progress", progress_node)

    g.set_entry_point("quiz_generation")
    g.add_edge("quiz_generation", END)
    return g.compile()


def build_quiz_eval_graph() -> StateGraph:
    """Quiz evaluation + badge update pipeline."""
    g = StateGraph(CareerState)
    g.add_node("quiz_evaluation", quiz_evaluation_node)
    g.add_node("badge", badge_node)
    g.add_node("progress", progress_node)

    g.set_entry_point("quiz_evaluation")
    g.add_edge("quiz_evaluation", "badge")
    g.add_edge("badge", "progress")
    g.add_edge("progress", END)
    return g.compile()


# Compiled singletons (built once at import)
analysis_graph = build_analysis_graph()
career_graph = build_career_graph()
roadmap_graph = build_roadmap_graph()
quiz_graph = build_quiz_graph()
quiz_eval_graph = build_quiz_eval_graph()


def build_interview_question_graph() -> StateGraph:
    """Single-turn: generate one question."""
    g = StateGraph(InterviewState)
    g.add_node("generate_question", generate_question_node)
    g.set_entry_point("generate_question")
    g.add_edge("generate_question", END)
    return g.compile()


def build_interview_eval_graph() -> StateGraph:
    """Single-turn: evaluate answer + optional follow-up."""
    g = StateGraph(InterviewState)
    g.add_node("evaluate", evaluate_answer_node)
    g.add_node("followup", generate_followup_node)
    g.set_entry_point("evaluate")
    g.add_edge("evaluate", "followup")
    g.add_edge("followup", END)
    return g.compile()


def build_interview_report_graph() -> StateGraph:
    """Final: generate report."""
    g = StateGraph(InterviewState)
    g.add_node("report", generate_report_node)
    g.set_entry_point("report")
    g.add_edge("report", END)
    return g.compile()


interview_question_graph = build_interview_question_graph()
interview_eval_graph = build_interview_eval_graph()
interview_report_graph = build_interview_report_graph()
