import json
import re
from .state import InterviewState
from .llm import get_llm

QUESTION_DISTRIBUTION = {
    "Technical": 5,
    "Behavioral": 2,
    "Project Based": 2,
    "Scenario Based": 1,
}
SCENARIO_ONLY_DISTRIBUTION = {"Scenario Based": 5}


def _parse_json(text: str) -> dict:
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    match = re.search(r"(\{[\s\S]*\})", text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    return {}


def _avg(scores: list) -> float:
    return round(sum(scores) / len(scores), 1) if scores else 0.0


def generate_question_node(state: InterviewState) -> InterviewState:
    """Generate the next interview question adaptively."""
    llm = get_llm()
    q_num = state.get("question_number", 0)
    asked = state.get("asked_questions", [])
    history = state.get("interview_history", [])
    difficulty = state.get("difficulty", "Intermediate")

    # Determine question type — scenario-only mode overrides distribution
    force_scenario = state.get("force_scenario", False)
    distribution = SCENARIO_ONLY_DISTRIBUTION if force_scenario else QUESTION_DISTRIBUTION
    type_counts = {t: 0 for t in distribution}
    for h in history:
        t = h.get("question_type", "Technical")
        if t in type_counts:
            type_counts[t] += 1

    q_type = max(
        distribution,
        key=lambda t: max(0, distribution[t] - type_counts.get(t, 0))
    )

    # Build history summary for context
    history_summary = ""
    if history:
        last = history[-1]
        history_summary = f"\nLast Q: {last.get('question', '')}\nLast A: {last.get('answer', '')}\nLast score: {last.get('overall_score', 5)}/10"

    total_q = state.get("total_questions", 10)
    prompt = f"""You are an expert technical interviewer for the role of {state.get('role', 'Software Engineer')}.

CANDIDATE PROFILE:
- Skills: {state.get('skills', [])}
- Skill Gaps: {state.get('missing_skills', [])}
- Experience: {state.get('experience_years', 0)} years
- Resume Summary: {state.get('resume_summary', '')[:300]}

INTERVIEW CONTEXT:
- Question #{q_num + 1} of {total_q}
- Question Type: {q_type}
- Difficulty: {difficulty}
- Already asked: {asked[-5:] if asked else []}
{history_summary}

Generate ONE {q_type} question at {difficulty} level.
- Do NOT repeat any already asked question.
- Make it specific to the role and candidate's profile.
- For Technical: test practical knowledge.
- For Behavioral: use STAR format prompts.
- For Project Based: ask about implementation details.
- For Scenario Based: present a real-world problem.

Return ONLY valid JSON:
{{
  "question": "<the question text>",
  "question_type": "{q_type}",
  "difficulty": "{difficulty}",
  "expected_topics": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "follow_up_hint": "<what to probe if answer is shallow>"
}}"""

    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)

    question = {
        "question": parsed.get("question", f"Tell me about your experience with {state.get('role', 'this role')}."),
        "question_type": parsed.get("question_type", q_type),
        "difficulty": parsed.get("difficulty", difficulty),
        "expected_topics": parsed.get("expected_topics", []),
        "follow_up_hint": parsed.get("follow_up_hint", ""),
        "number": q_num + 1,
    }

    new_asked = list(asked) + [question["question"]]
    print(f"[InterviewQ] #{q_num + 1} [{q_type}][{difficulty}]: {question['question'][:80]}")

    return {**state, "current_question": question, "asked_questions": new_asked}


def evaluate_answer_node(state: InterviewState) -> InterviewState:
    """Evaluate the candidate's answer and update running scores."""
    llm = get_llm()
    question = state.get("current_question", {})
    answer = state.get("current_answer", "")

    if not answer.strip():
        eval_result = {
            "technical": 0, "communication": 0, "completeness": 0, "confidence": 0,
            "feedback": "No answer provided.",
            "strengths": [], "weaknesses": ["No answer given"],
            "followup_needed": False, "overall_score": 0,
        }
    else:
        prompt = f"""You are an expert interview evaluator. Evaluate this answer objectively.

ROLE: {state.get('role', 'Software Engineer')}
QUESTION TYPE: {question.get('question_type', 'Technical')}
QUESTION: {question.get('question', '')}
EXPECTED TOPICS: {question.get('expected_topics', [])}

CANDIDATE ANSWER: {answer}

Score each dimension 0-10 strictly:
- technical: depth of technical knowledge (0=wrong/missing, 10=expert-level)
- communication: clarity, structure, conciseness
- completeness: covers all expected topics
- confidence: assertiveness and certainty in delivery (infer from text)

Return ONLY valid JSON:
{{
  "technical": <0-10>,
  "communication": <0-10>,
  "completeness": <0-10>,
  "confidence": <0-10>,
  "feedback": "<2-3 sentence specific feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>"],
  "followup_needed": <true if answer is shallow or incomplete>
}}"""

        response = llm.invoke(prompt)
        eval_result = _parse_json(response.content)
        if not eval_result.get("feedback"):
            eval_result = {
                "technical": 5, "communication": 5, "completeness": 5, "confidence": 5,
                "feedback": "Answer evaluated.", "strengths": [], "weaknesses": [],
                "followup_needed": False,
            }

    overall = round(
        eval_result.get("technical", 5) * 0.4 +
        eval_result.get("communication", 5) * 0.2 +
        eval_result.get("completeness", 5) * 0.25 +
        eval_result.get("confidence", 5) * 0.15,
        1
    )
    eval_result["overall_score"] = overall

    # Append to history
    history_entry = {
        "question": question.get("question", ""),
        "question_type": question.get("question_type", "Technical"),
        "difficulty": question.get("difficulty", "Intermediate"),
        "answer": answer,
        "technical_score": eval_result.get("technical", 5),
        "communication_score": eval_result.get("communication", 5),
        "completeness_score": eval_result.get("completeness", 5),
        "confidence_score": eval_result.get("confidence", 5),
        "overall_score": overall,
        "feedback": eval_result.get("feedback", ""),
        "strengths": eval_result.get("strengths", []),
        "weaknesses": eval_result.get("weaknesses", []),
        "followup_needed": eval_result.get("followup_needed", False),
    }
    history = list(state.get("interview_history", [])) + [history_entry]

    # Adapt difficulty
    if overall >= 8:
        new_difficulty = "Advanced"
    elif overall < 5:
        new_difficulty = "Beginner"
    else:
        new_difficulty = "Intermediate"

    # Update running scores
    tech_scores = [h["technical_score"] for h in history]
    comm_scores = [h["communication_score"] for h in history]
    conf_scores = [h["confidence_score"] for h in history]
    comp_scores = [h["completeness_score"] for h in history]

    print(f"[InterviewEval] Q#{state.get('question_number', 0) + 1} overall={overall} -> next difficulty={new_difficulty}")

    return {
        **state,
        "interview_history": history,
        "current_question": {**question, "evaluation": eval_result},
        "question_number": state.get("question_number", 0) + 1,
        "difficulty": new_difficulty,
        "technical_score": _avg(tech_scores),
        "communication_score": _avg(comm_scores),
        "confidence_score": _avg(conf_scores),
        "completeness_score": _avg(comp_scores),
        "overall_score": _avg([h["overall_score"] for h in history]),
    }


def generate_followup_node(state: InterviewState) -> InterviewState:
    """Generate a follow-up question if the answer was incomplete."""
    llm = get_llm()
    history = state.get("interview_history", [])
    if not history:
        return state

    last = history[-1]
    if not last.get("followup_needed", False):
        return state

    prompt = f"""Generate a probing follow-up question.

Original Question: {last.get('question', '')}
Candidate Answer: {last.get('answer', '')}
Weaknesses identified: {last.get('weaknesses', [])}
Follow-up hint: {state.get('current_question', {}).get('follow_up_hint', '')}

Generate a specific follow-up that probes the gap. Keep it SHORT (one sentence).
Return ONLY valid JSON: {{"followup": "<question text>"}}"""

    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)
    followup_text = parsed.get("followup", "")

    if followup_text:
        current_q = dict(state.get("current_question", {}))
        current_q["followup"] = followup_text
        return {**state, "current_question": current_q}

    return state


def generate_report_node(state: InterviewState) -> InterviewState:
    """Generate the final interview report with hiring recommendation."""
    llm = get_llm()
    history = state.get("interview_history", [])
    overall = state.get("overall_score", 0)

    all_strengths = []
    all_weaknesses = []
    for h in history:
        all_strengths.extend(h.get("strengths", []))
        all_weaknesses.extend(h.get("weaknesses", []))

    prompt = f"""You are a senior hiring manager. Produce the final interview assessment.

ROLE: {state.get('role', 'Software Engineer')}
CANDIDATE SKILLS: {state.get('skills', [])}
SKILL GAPS: {state.get('missing_skills', [])}

INTERVIEW SCORES:
- Technical: {state.get('technical_score', 0)}/10
- Communication: {state.get('communication_score', 0)}/10
- Confidence: {state.get('confidence_score', 0)}/10
- Completeness: {state.get('completeness_score', 0)}/10
- Overall: {overall}/10

STRENGTHS OBSERVED: {list(set(all_strengths))[:8]}
WEAKNESSES OBSERVED: {list(set(all_weaknesses))[:8]}

Based on these scores, provide:
1. Top 3 strengths
2. Top 3 improvement areas
3. 4 specific learning recommendations
4. Hiring recommendation: one of ["Strong Hire", "Hire", "Borderline", "Needs Improvement"]
   - Strong Hire: overall >= 8
   - Hire: overall >= 6.5
   - Borderline: overall >= 5
   - Needs Improvement: overall < 5

Return ONLY valid JSON:
{{
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<area 1>", "<area 2>", "<area 3>"],
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>", "<rec 4>"],
  "hiring_recommendation": "<Strong Hire|Hire|Borderline|Needs Improvement>"
}}"""

    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)

    # Fallback hiring recommendation based on score
    if not parsed.get("hiring_recommendation"):
        if overall >= 8:
            rec = "Strong Hire"
        elif overall >= 6.5:
            rec = "Hire"
        elif overall >= 5:
            rec = "Borderline"
        else:
            rec = "Needs Improvement"
        parsed["hiring_recommendation"] = rec

    print(f"[InterviewReport] overall={overall} -> {parsed.get('hiring_recommendation')}")

    return {
        **state,
        "strengths": parsed.get("strengths", []),
        "weaknesses": parsed.get("weaknesses", []),
        "recommendations": parsed.get("recommendations", []),
        "hiring_recommendation": parsed.get("hiring_recommendation", "Borderline"),
    }
