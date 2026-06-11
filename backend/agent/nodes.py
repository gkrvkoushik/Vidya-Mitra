import json
import re
from .state import CareerState
from .llm import get_llm


def _parse_json(text: str) -> dict:
    """Extract JSON from LLM response robustly — tries multiple strategies."""
    # Strategy 1: fenced code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        candidate = match.group(1).strip()
        try:
            return json.loads(candidate)
        except Exception:
            pass

    # Strategy 2: first { ... } block (outermost braces)
    match = re.search(r"(\{[\s\S]*\})", text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # Strategy 3: raw text
    try:
        return json.loads(text.strip())
    except Exception:
        pass

    print(f"[_parse_json] FAILED to parse LLM output:\n{text[:500]}")
    return {}


def resume_parser_node(state: CareerState) -> CareerState:
    """LLM extracts skills, education level, and experience years — no scoring."""
    llm = get_llm()
    resume_text = state.get('resume_text', '')

    print(f"\n[ResumeParser] resume_text length: {len(resume_text)} chars")
    print(f"[ResumeParser] first 300 chars:\n{resume_text[:300]}\n")

    prompt = f"""Extract factual information from this resume. Do NOT invent or infer beyond what is written.

Return ONLY valid JSON with these keys:
- skills: list of specific skills, tools, technologies, and certifications explicitly mentioned
- education: one of ["High School", "Associate", "Bachelor", "Master", "PhD", "None"] — pick the highest level present
- education_field: the field of study (e.g. "Computer Science", "Medicine", "Accounting") or "" if not mentioned
- experience_years: integer total years of work experience (internships count as 0.5 each), 0 if none
- experience: list of job/internship titles and companies as strings

Resume:
{resume_text[:4000]}
"""
    response = llm.invoke(prompt)
    print(f"[ResumeParser] LLM raw response:\n{response.content[:600]}\n")

    parsed = _parse_json(response.content)
    print(f"[ResumeParser] parsed skills: {parsed.get('skills', [])}")
    print(f"[ResumeParser] education: {parsed.get('education')} | exp_years: {parsed.get('experience_years')}")

    return {
        **state,
        "skills": parsed.get("skills", []),
        "profile": {
            **state.get("profile", {}),
            "education": parsed.get("education", "None"),
            "education_field": parsed.get("education_field", ""),
            "experience_years": parsed.get("experience_years", 0),
            "experience": parsed.get("experience", []),
        },
    }


def jd_parser_node(state: CareerState) -> CareerState:
    """LLM extracts required skills, preferred skills, education requirement, experience requirement — no scoring."""
    llm = get_llm()
    jd_text = state.get('job_description', '')
    print(f"\n[JDParser] jd length: {len(jd_text)} chars")

    prompt = f"""Extract factual requirements from this job description. Do NOT invent requirements.

Return ONLY valid JSON with these keys:
- role: job title as a short string
- required_skills: list of skills/tools/certifications explicitly required (short names, e.g. "Python", "ICD-10", "React")
- preferred_skills: list of skills explicitly marked as preferred/nice-to-have/bonus (short names)
- required_education: one of ["High School", "Associate", "Bachelor", "Master", "PhD", "None"] — minimum required
- required_experience_years: integer minimum years of experience required, 0 if not specified or entry-level/fresher
- responsibilities: list of key responsibilities as strings

Job Description:
{jd_text[:3000]}
"""
    response = llm.invoke(prompt)
    print(f"[JDParser] LLM raw response:\n{response.content[:400]}\n")
    parsed = _parse_json(response.content)
    print(f"[JDParser] required_skills: {parsed.get('required_skills', [])}")
    print(f"[JDParser] preferred_skills: {parsed.get('preferred_skills', [])}")
    print(f"[JDParser] required_education: {parsed.get('required_education')} | required_exp: {parsed.get('required_experience_years')}")
    return {**state, "jd_parsed": parsed}


def resume_match_node(state: CareerState) -> CareerState:
    """LLM semantically maps resume skills to JD required/preferred lists separately.
    LLM only identifies what matches — all counting and percentages are computed here."""
    llm = get_llm()
    candidate_skills = state.get("skills", [])
    jd_parsed = state.get("jd_parsed", {})
    required_skills = jd_parsed.get("required_skills", [])
    preferred_skills = jd_parsed.get("preferred_skills", [])

    if not required_skills and not preferred_skills:
        return {
            **state,
            "matched_skills": [], "missing_skills": [],
            "matched_preferred": [], "missing_preferred": [],
            "matched_required_count": 0, "total_required_count": 0,
            "matched_preferred_count": 0, "total_preferred_count": 0,
            "match_percentage": 0.0,
        }

    prompt = f"""You are a technical recruiter. Semantically match the candidate's skills against two skill lists.

CANDIDATE SKILLS: {candidate_skills}

REQUIRED SKILLS (from JD): {required_skills}
PREFERRED SKILLS (from JD): {preferred_skills}

Rules:
- Use semantic understanding. "React" satisfies "frontend framework". "Python" satisfies "scripting language".
- "Bachelor's in Computer Science" satisfies "programming fundamentals". "MySQL" satisfies "relational databases".
- Only mark a skill as matched if the candidate clearly has it or a direct equivalent.
- Return each JD skill in exactly one list: either matched or unmatched.
- Do NOT add skills that aren't in the JD lists.

Return ONLY valid JSON:
{{
  "matched_required": ["exact JD skill name that was matched"],
  "unmatched_required": ["exact JD skill name that was NOT matched"],
  "matched_preferred": ["exact JD preferred skill that was matched"],
  "unmatched_preferred": ["exact JD preferred skill that was NOT matched"]
}}"""

    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)

    matched_req = parsed.get("matched_required", [])
    unmatched_req = parsed.get("unmatched_required", [])
    matched_pref = parsed.get("matched_preferred", [])
    unmatched_pref = parsed.get("unmatched_preferred", [])

    total_req = len(required_skills)
    total_pref = len(preferred_skills)
    matched_req_count = len(matched_req)
    matched_pref_count = len(matched_pref)

    # match_percentage = matched out of all identifiable skills (required + preferred)
    total_identifiable = total_req + total_pref
    match_pct = round(
        ((matched_req_count + matched_pref_count) / total_identifiable * 100)
        if total_identifiable else 0.0,
        1
    )

    print(f"[ResumeMatch] required: {matched_req_count}/{total_req} | preferred: {matched_pref_count}/{total_pref} | match%: {match_pct}")

    return {
        **state,
        "matched_skills": matched_req,
        "missing_skills": unmatched_req,
        "matched_preferred": matched_pref,
        "missing_preferred": unmatched_pref,
        "matched_required_count": matched_req_count,
        "total_required_count": total_req,
        "matched_preferred_count": matched_pref_count,
        "total_preferred_count": total_pref,
        "match_percentage": match_pct,
    }


# ── Education level hierarchy ──────────────────────────────────────────────────
_EDU_RANK = {"None": 0, "High School": 1, "Associate": 2, "Bachelor": 3, "Master": 4, "PhD": 5}


def _education_score(candidate_edu: str, required_edu: str) -> float:
    """Return 0–100: 100 if candidate meets or exceeds requirement, scales down proportionally."""
    c = _EDU_RANK.get(candidate_edu, 0)
    r = _EDU_RANK.get(required_edu, 0)
    if r == 0:
        return 100.0  # no education requirement → full marks
    if c >= r:
        return 100.0
    # partial credit: proportion of education levels achieved
    return round((c / r) * 100, 1)


def _experience_score(candidate_years: float, required_years: int) -> float:
    """Return 0–100: 100 if candidate meets requirement, scales down proportionally."""
    if required_years == 0:
        return 100.0  # entry-level / no requirement → full marks
    score = min(candidate_years / required_years, 1.0) * 100
    return round(score, 1)


def _apply_required_gate(raw_score: int, required_ratio: float) -> int:
    """Hard gate based on required skill coverage.

    Thresholds (chosen to mirror real ATS rejection behaviour):
        ratio == 0        → 5   (near-instant rejection, keeps some floor)
        ratio <  0.20     → cap 25
        ratio <  0.40     → cap 50
        ratio >= 0.40     → uncapped
    """
    if required_ratio == 0:
        return 5
    if required_ratio < 0.20:
        return min(raw_score, 25)
    if required_ratio < 0.40:
        return min(raw_score, 50)
    return raw_score


def ats_score_node(state: CareerState) -> CareerState:
    """Deterministic weighted ATS formula — no LLM.

    Weights:
        Required Skills  : 80%
        Preferred Skills : 10%
        Education Match  :  5%
        Experience       :  5%

    Post-calculation gating on required-skill ratio prevents
    high edu/exp scores from inflating a fundamentally unqualified resume.
    """
    matched_req  = state.get("matched_required_count", 0)
    total_req    = state.get("total_required_count", 0)
    matched_pref = state.get("matched_preferred_count", 0)
    total_pref   = state.get("total_preferred_count", 0)

    profile   = state.get("profile", {})
    jd_parsed = state.get("jd_parsed", {})

    candidate_edu   = profile.get("education", "None")
    required_edu    = jd_parsed.get("required_education", "None")
    candidate_years = float(profile.get("experience_years", 0))
    required_years  = int(jd_parsed.get("required_experience_years", 0))

    req_score  = (matched_req  / total_req  * 100) if total_req  else 100.0
    pref_score = (matched_pref / total_pref * 100) if total_pref else 100.0
    edu_score  = _education_score(candidate_edu, required_edu)
    exp_score  = _experience_score(candidate_years, required_years)

    raw_ats = round(
        req_score  * 0.80 +
        pref_score * 0.10 +
        edu_score  * 0.05 +
        exp_score  * 0.05
    )

    required_ratio = matched_req / total_req if total_req else 1.0
    ats = _apply_required_gate(raw_ats, required_ratio)

    print(
        f"[ATSScore] req={req_score:.1f}*0.80 + pref={pref_score:.1f}*0.10 + "
        f"edu={edu_score:.1f}*0.05 + exp={exp_score:.1f}*0.05 = raw {raw_ats} "
        f"-> gated {ats} (required_ratio={required_ratio:.2f})"
    )

    return {
        **state,
        "ats_score": ats,
        "education_score": edu_score,
        "experience_score": exp_score,
    }


def skill_gap_node(state: CareerState) -> CareerState:
    """Pure Python: combine unmatched required + preferred into a prioritised missing list.
    Required gaps come first (higher priority for hiring), preferred gaps second."""
    missing_required  = state.get("missing_skills", [])    # unmatched required
    missing_preferred = state.get("missing_preferred", [])  # unmatched preferred
    # Required gaps are higher priority — keep order from JD, then append preferred gaps
    prioritized = missing_required + [s for s in missing_preferred if s not in missing_required]
    print(f"[SkillGap] {len(missing_required)} required gaps + {len(missing_preferred)} preferred gaps")
    return {**state, "missing_skills": prioritized}


def recommendation_node(state: CareerState) -> CareerState:
    """LLM explains the deterministic score and generates actionable recommendations.
    The AI explains the score — it does NOT generate it."""
    llm = get_llm()

    matched_req  = state.get("matched_required_count", 0)
    total_req    = state.get("total_required_count", 0)
    matched_pref = state.get("matched_preferred_count", 0)
    total_pref   = state.get("total_preferred_count", 0)
    profile      = state.get("profile", {})
    jd_parsed    = state.get("jd_parsed", {})

    prompt = f"""A candidate received an ATS score of {state.get('ats_score')}/100 for the role of "{jd_parsed.get('role', 'the target role')}".

Score breakdown (already calculated — do NOT change these numbers):
- Required skills matched: {matched_req}/{total_req} → {round(matched_req/total_req*100) if total_req else 100}% (weight 80%)
- Preferred skills matched: {matched_pref}/{total_pref} → {round(matched_pref/total_pref*100) if total_pref else 100}% (weight 10%)
- Education score: {state.get('education_score', 0)}% (weight 5%)
- Experience score: {state.get('experience_score', 0)}% (weight 5%)
- A hard gate was applied if required skill ratio was below 40% — this is intentional.

Candidate profile:
- Skills: {state.get('skills', [])}
- Missing required skills: {state.get('missing_skills', [])[:8]}
- Education: {profile.get('education')} in {profile.get('education_field', 'N/A')}
- Experience: {profile.get('experience_years', 0)} years

Provide an honest, specific analysis. Do NOT invent a different score.

Return ONLY valid JSON:
{{
  "strengths": ["<specific strength based on matched skills>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<specific gap based on missing skills>", "<weakness 2>", "<weakness 3>"],
  "recommendations": [
    "<concrete action to improve score, e.g. learn X certification>",
    "<recommendation 2>",
    "<recommendation 3>",
    "<recommendation 4>",
    "<recommendation 5>"
  ]
}}"""

    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)
    return {
        **state,
        "strengths": parsed.get("strengths", []),
        "weaknesses": parsed.get("weaknesses", []),
        "recommendations": parsed.get("recommendations", state.get("recommendations", [])),
    }


# ── Career Path Templates & Helper ─────────────────────────────────────────────
ROLE_TEMPLATES = {
    "Backend Developer": ["Python", "SQL", "APIs", "Docker", "Databases", "Git", "CI/CD", "Cloud Computing"],
    "Full Stack Developer": ["React", "Node.js", "JavaScript", "HTML/CSS", "SQL", "APIs", "Git", "Docker"],
    "Frontend Developer": ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "TypeScript", "Git", "APIs"],
    "AI Engineer": ["Python", "Machine Learning", "Deep Learning", "NLP", "APIs", "Git", "Cloud Computing"],
    "Data Scientist": ["Python", "SQL", "Machine Learning", "Data Analysis", "Statistics", "Git"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Python", "Data Analysis", "Statistics"],
    "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "Cloud Computing", "Linux", "Git", "Infrastructure as Code"],
    "Cloud Engineer": ["Cloud Computing", "Linux", "Docker", "Networking", "Git", "CI/CD", "Kubernetes"],
    "Cybersecurity Analyst": ["Networking", "Linux", "Security Principles", "Cryptography", "Python", "Threat Analysis"],
    "Network Engineer": ["Networking", "Cisco", "Linux", "Python", "Security Principles", "Cloud Computing"],
    "Mobile App Developer": ["Kotlin", "Swift", "Mobile Design", "APIs", "Git", "OOP"]
}


def _get_role_standard_skills(role: str) -> list:
    role_lower = role.lower().strip()
    # Check exact match first
    for k, v in ROLE_TEMPLATES.items():
        if k.lower() == role_lower:
            return v
    # Check partial match (e.g. "Network Technician" -> "Network Engineer")
    for k, v in ROLE_TEMPLATES.items():
        if k.lower() in role_lower or role_lower in k.lower():
            return v
    # Fallback: query LLM to get 6-8 core technical skills for this custom role
    try:
        llm = get_llm()
        prompt = f"""List the top 6-8 core, standard technical skills, technologies, or concepts required for the role of "{role}".
Return ONLY a valid JSON list of strings (short skill names, e.g. "Python", "SQL", "Docker"). No explanations, no numbering.
Example: ["Python", "SQL", "Docker"]
"""
        response = llm.invoke(prompt)
        parsed = _parse_json(response.content)
        if isinstance(parsed, list):
            return [str(s).strip() for s in parsed if s]
    except Exception as e:
        print(f"[_get_role_standard_skills] Error fetching skills for {role}: {e}")
    # Default fallback
    return ["Python", "Git", "Docker", "Cloud Computing", "SQL", "CI/CD"]


def career_path_node(state: CareerState) -> CareerState:
    """Recommend top 3 career paths based on skills and profile."""
    llm = get_llm()
    skills = state.get("skills", [])
    education = state.get("profile", {}).get("education", "")
    experience = state.get("profile", {}).get("experience", [])

    prompt = f"""Based on the candidate profile:
- Skills: {skills}
- Education: {education}
- Experience: {experience}

Choose EXACTLY 3 career paths from this list of standard roles:
[
  "Backend Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "AI Engineer",
  "Data Scientist",
  "Data Analyst",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "Network Engineer",
  "Mobile App Developer"
]

Rules:
1. Select only from the list of standard roles above.
2. Match candidate skills realistically to the chosen roles.
3. Provide a realistic match percentage (integer between 0 and 100), estimated salary range, list of recommended certifications, and a clear reason explaining why this path fits the candidate.
4. Return ONLY valid JSON with key "roles" (list of objects each with: title, match_percentage, salary_range, certifications (list), reason).
"""
    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)
    return {**state, "recommended_roles": parsed.get("roles", [])}


def roadmap_node(state: CareerState) -> CareerState:
    """Generate a detailed, skill-aligned week-by-week learning roadmap."""
    llm = get_llm()
    role = state.get("selected_role", "Software Engineer")
    current_skills = state.get("skills", [])
    
    # 1. Fetch standard skills for the target role
    role_skills = _get_role_standard_skills(role)
    
    # 2. Subtract current skills to compute missing skills
    current_skills_lower = {s.lower().strip() for s in current_skills}
    missing_skills = [s for s in role_skills if s.lower().strip() not in current_skills_lower]
    
    # Ensure there are at least 3 missing skills if they somehow knew everything,
    # so we don't have an empty roadmap.
    if not missing_skills:
        missing_skills = role_skills[:3]
        
    weeks = state.get("roadmap_weeks", 8)
    
    # Bounding the weeks to prevent hallucination / overstretching when gaps are few
    weeks = max(3, min(weeks, len(missing_skills) * 2))

    already_known = current_skills[:30]
    skills_to_learn = missing_skills[:30]

    prompt = f"""You are an expert technical career coach. Create a strict week-by-week learning roadmap.

CANDIDATE PROFILE:
- Target Role: {role}
- Candidate's EXISTING skills (they already know these): {already_known}
- Skills candidate MUST LEARN (gaps for this role): {skills_to_learn}
- Total weeks: {weeks}

CRITICAL RULES:
1. Each week = ONE focused topic. No multi-topic weeks.
2. First weeks MUST target the top items from the "MUST LEARN" gaps list above.
3. NEVER add a week to teach a skill that is already in the "EXISTING skills" list — build ON them instead.
4. Topics must be specific and progressive: NOT "Learn Docker" but "Docker multi-stage builds and container networking".
5. Resources must be real, actionable resources: actual course names, official documentation links, or books.
6. required_skills: list 1-3 prerequisites this week needs that were gained in PREVIOUS weeks of this roadmap. Do NOT include skills from the "EXISTING skills" list here, as the user already knows them.
7. current_skills_used: list 1-3 skills from the "EXISTING skills" list that the candidate already knows and will actively use this week. Do NOT include any progressive skills learned during the roadmap here. If none are relevant, you MUST use [].
8. skill_gained: MUST be a single, short skill name. It MUST be chosen from the "Skills candidate MUST LEARN" list ({skills_to_learn}) if the week addresses one of those gaps. Multiple weeks can target/gain the same skill (e.g. if two weeks cover Docker, both weeks must have "Docker" as the skill_gained). Under no circumstances should you invent custom long strings (like "Docker Multi-Stage Builds") or combine multiple skills (like "Python and CI/CD") for this field. If a week does not address any skill from the MUST LEARN list, it must gain a simple, short skill name (1-2 words max).
9. skill_alignment: list 1-3 skills this week directly builds upon (can be from the "EXISTING skills" list or skills gained in PREVIOUS weeks).
10. estimated_hours: Beginner=8-15h, Intermediate=15-25h, Advanced=20-35h.
11. Role Relevance: Every topic, description, and resource must be directly context-aligned and relevant to the target role of {role}.

Return ONLY valid JSON:
{{
  "roadmap": [
    {{
      "week": 1,
      "topic": "<specific topic name>",
      "description": "<2-3 sentences: what to learn and why it matters for {role}>",
      "difficulty": "<Beginner|Intermediate|Advanced>",
      "estimated_hours": <int>,
      "skill_gained": "<exact short skill name from MUST LEARN list or new short skill>",
      "required_skills": ["<prerequisite gained in PREVIOUS weeks only>"],
      "current_skills_used": ["<starting skill from EXISTING list used this week>"],
      "skill_alignment": ["<skill from EXISTING list or PREVIOUS weeks this builds upon>"],
      "resources": ["<Real Resource 1>", "<Real Resource 2>"]
    }}
  ]
}}

Generate exactly {weeks} weeks. Each week must build progressively. Weeks must cover the MUST LEARN gaps — not re-teach existing skills."""

    print(f"\n[RoadmapNode] Generating {weeks}-week roadmap for role='{role}'")
    print(f"[RoadmapNode] current_skills={current_skills}")
    print(f"[RoadmapNode] missing_skills={missing_skills}")

    response = llm.invoke(prompt)
    print(f"[RoadmapNode] raw response (first 400 chars):\n{response.content[:400]}")

    parsed = _parse_json(response.content)
    roadmap = parsed.get("roadmap", [])

    already_known_lower = {s.lower() for s in already_known}
    already_known_map = {s.lower(): s for s in already_known}
    skills_to_learn_lower = {s.lower() for s in skills_to_learn}
    skills_to_learn_map = {s.lower(): s for s in skills_to_learn}

    validated = []
    previous_gained = set()

    for i, week in enumerate(roadmap):
        if not isinstance(week, dict):
            continue

        # 1. Clean skill_gained to match a skill from the MUST LEARN list
        gained = week.get("skill_gained", "").strip()
        gained_lower = gained.lower()
        matched_skill = None
        for s in skills_to_learn:
            if s.lower() in gained_lower or gained_lower in s.lower():
                matched_skill = s
                break
        if matched_skill:
            skill_gained_cleaned = matched_skill
        else:
            words = gained.split()
            skill_gained_cleaned = " ".join(words[:2]) if len(words) > 3 else gained

        # 2. Process required_skills and current_skills_used to resolve duplicates & conflicts
        req_raw = week.get("required_skills", [])
        curr_raw = week.get("current_skills_used", [])
        if not isinstance(req_raw, list):
            req_raw = [req_raw] if req_raw else []
        if not isinstance(curr_raw, list):
            curr_raw = [curr_raw] if curr_raw else []

        req_cleaned = []
        curr_cleaned = []

        # Check required_skills
        for r in req_raw:
            if not isinstance(r, str):
                continue
            r_clean = r.strip()
            r_lower = r_clean.lower()
            if r_lower in already_known_lower:
                # Actually belongs to current_skills_used since it's an initial existing skill
                if already_known_map[r_lower] not in curr_cleaned:
                    curr_cleaned.append(already_known_map[r_lower])
            elif r_clean in previous_gained or any(pg.lower() == r_lower for pg in previous_gained):
                # Valid prerequisite gained in a previous week
                pg_exact = next((pg for pg in previous_gained if pg.lower() == r_lower), r_clean)
                if pg_exact not in req_cleaned:
                    req_cleaned.append(pg_exact)

        # Check current_skills_used
        for c in curr_raw:
            if not isinstance(c, str):
                continue
            c_clean = c.strip()
            c_lower = c_clean.lower()
            if c_lower in already_known_lower:
                if already_known_map[c_lower] not in curr_cleaned:
                    curr_cleaned.append(already_known_map[c_lower])
            elif c_clean in previous_gained or any(pg.lower() == c_lower for pg in previous_gained):
                # Actually belongs to required_skills since it was learned during the roadmap
                pg_exact = next((pg for pg in previous_gained if pg.lower() == c_lower), c_clean)
                if pg_exact not in req_cleaned:
                    req_cleaned.append(pg_exact)

        # 3. Clean skill_alignment
        align_raw = week.get("skill_alignment", [])
        if not isinstance(align_raw, list):
            align_raw = [align_raw] if align_raw else []
        align_cleaned = []
        for a in align_raw:
            if not isinstance(a, str):
                continue
            a_clean = a.strip()
            a_lower = a_clean.lower()
            if a_lower in already_known_lower:
                align_cleaned.append(already_known_map[a_lower])
            elif a_clean in previous_gained or any(pg.lower() == a_lower for pg in previous_gained):
                pg_exact = next((pg for pg in previous_gained if pg.lower() == a_lower), a_clean)
                align_cleaned.append(pg_exact)
            elif a_lower in skills_to_learn_lower:
                align_cleaned.append(skills_to_learn_map[a_lower])
            else:
                align_cleaned.append(a_clean)

        align_cleaned = list(dict.fromkeys(align_cleaned))

        resources_raw = week.get("resources", [])
        if not isinstance(resources_raw, list):
            resources_raw = [resources_raw] if resources_raw else []
        resources_cleaned = [str(r).strip() for r in resources_raw if r]

        validated.append({
            "week": week.get("week", i + 1),
            "topic": week.get("topic", f"Week {i+1} Topic"),
            "description": week.get("description", ""),
            "difficulty": week.get("difficulty", "Intermediate"),
            "estimated_hours": week.get("estimated_hours", 10),
            "skill_gained": skill_gained_cleaned,
            "required_skills": req_cleaned,
            "current_skills_used": curr_cleaned,
            "skill_alignment": align_cleaned,
            "resources": resources_cleaned,
        })

        # Add current week's cleaned gained skill to previous_gained
        previous_gained.add(skill_gained_cleaned)

    print(f"[RoadmapNode] validated {len(validated)} weeks")
    return {
        **state,
        "skills": current_skills,
        "missing_skills": missing_skills,
        "roadmap": validated
    }


def quiz_generation_node(state: CareerState) -> CareerState:
    """Generate 10 MCQ quiz questions for a given skill and difficulty."""
    llm = get_llm()
    prompt = f"""Generate exactly 10 multiple choice questions on: {state.get('quiz_skill', 'Python')}
Difficulty: {state.get('quiz_difficulty', 'Medium')}

Return ONLY valid JSON with key: questions (list of 10 objects each with:
  question (string),
  options (list of 4 strings),
  correct_index (int 0-3),
  explanation (string)
)
"""
    response = llm.invoke(prompt)
    parsed = _parse_json(response.content)
    return {**state, "quiz_questions": parsed.get("questions", [])}


def quiz_evaluation_node(state: CareerState) -> CareerState:
    """Evaluate submitted quiz answers and compute score."""
    questions = state.get("quiz_questions", [])
    answers = state.get("quiz_answers", [])

    correct = wrong = unattempted = 0
    for i, q in enumerate(questions):
        if i >= len(answers) or answers[i] == -1:
            unattempted += 1
        elif answers[i] == q.get("correct_index"):
            correct += 1
        else:
            wrong += 1

    points = max(0, correct * 5 - wrong * 1)
    score_pct = round((correct / len(questions) * 100) if questions else 0, 1)

    return {
        **state,
        "quiz_results": {
            "skill": state.get("quiz_skill"),
            "difficulty": state.get("quiz_difficulty"),
            "correct": correct,
            "wrong": wrong,
            "unattempted": unattempted,
            "score_percentage": score_pct,
            "points_earned": points,
        },
    }


def badge_node(state: CareerState) -> CareerState:
    """Assign badge based on total points."""
    points = state.get("total_points", 0)
    if points >= 2500:
        badge = "Master"
    elif points >= 1501:
        badge = "Platinum"
    elif points >= 1001:
        badge = "Diamond"
    elif points >= 501:
        badge = "Gold"
    elif points >= 251:
        badge = "Silver"
    else:
        badge = "Bronze"
    return {**state, "badge": badge}


def progress_node(state: CareerState) -> CareerState:
    """Aggregate progress metrics (pass-through, Firestore save is separate)."""
    return state


def save_to_firestore_node(state: CareerState) -> CareerState:
    """Persist analysis session results to Firestore."""
    from firebase_admin_init import get_db
    from google.cloud.firestore_v1 import SERVER_TIMESTAMP

    db = get_db()
    session_id = state.get("session_id", "")
    uid = state.get("uid", "")

    if session_id and uid:
        db.collection("analysis_sessions").document(session_id).set({
            "sessionId": session_id,
            "uid": uid,
            "resumeUrl": state.get("resume_url", ""),
            "jobDescription": state.get("job_description", ""),
            "status": "completed",
            "atsScore": state.get("ats_score", 0),
            "matchPercentage": state.get("match_percentage", 0),
            "matchedSkills": state.get("matched_skills", []),
            "missingSkills": state.get("missing_skills", []),
            "matchedPreferred": state.get("matched_preferred", []),
            "missingPreferred": state.get("missing_preferred", []),
            "matchedRequiredCount": state.get("matched_required_count", 0),
            "totalRequiredCount": state.get("total_required_count", 0),
            "matchedPreferredCount": state.get("matched_preferred_count", 0),
            "totalPreferredCount": state.get("total_preferred_count", 0),
            "educationScore": state.get("education_score", 0),
            "experienceScore": state.get("experience_score", 0),
            "strengths": state.get("strengths", []),
            "weaknesses": state.get("weaknesses", []),
            "recommendations": state.get("recommendations", []),
            "skills": state.get("skills", []),
            "createdAt": SERVER_TIMESTAMP,
        })

        # Log agent action
        db.collection("agent_logs").add({
            "uid": uid,
            "sessionId": session_id,
            "node": "SaveToFirestoreNode",
            "action": "analysis_saved",
            "status": "success",
            "timestamp": SERVER_TIMESTAMP,
        })

    return state
