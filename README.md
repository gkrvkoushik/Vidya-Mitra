# 🎓 VidyaGuide AI — Agentic Career Planning & Resume Mentor

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_Orchestrator-orange?style=for-the-badge&logo=langchain)](https://github.com/langchain-ai/langgraph)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Production-grade, Agentic AI-powered career planning, resume optimization, and mock interview platform.**

[🚀 System Architecture](#system-architecture) • [🤖 Agentic Workflows](#agentic-workflow) • [📊 Database Design](#firestore-database-design) • [🔌 API Reference](#api-documentation) • [🛠️ Setup Guide](#installation-guide)

</div>

---

## 📌 Project Overview

**VidyaGuide AI** is an advanced, production-grade Agentic AI-powered career planning and resume mentoring platform designed for students and job seekers. Unlike simple template matching tools, VidyaGuide AI coordinates multiple cooperative AI agents to analyze resumes semantically, identify critical skill gaps against actual job requirements, map custom roadmap pathways, generate adaptive tech quizzes, and conduct real-time voice-enabled mock interviews.

### 🌟 Core Capabilities
* **Resume Parsing & Skill Extraction:** Semantic extraction of candidate skills, education details, and work experience using Groq-powered LLMs.
* **Deterministic ATS Scoring:** Weighted resume-to-job matching with a defensive requirement gate preventing score inflation.
* **Cooperative Career Engines:** Intelligent recommendations for matching career paths with salary insight brackets and certification guides.
* **Dynamic, Custom Roadmaps:** Personalized study roadmap generation matching Fast, Moderate, or Slow learning paces.
* **Difficulty-Aware MCQ Engine:** Dynamic skill assessments with positive and negative scoring loops (`+5 / -1`).
* **Gamified Achievement Path:** Point-based milestone badges (Bronze up to Master).
* **Voice-Enabled Adaptive Mock Interviews:** Natural speech interaction using Web Speech APIs and real-time verbal performance assessment.

---

## ⚠️ Problem Statement

Finding a career path in the modern job market is highly fragmented:
1. **Tool Proliferation:** Candidates must use one tool to format their resume, another to calculate ATS scores, a third to build learning roadmaps, and a fourth to practice interviews.
2. **Context Fragmentation:** Mock interview tools do not know what skills are missing from a candidate's resume, and roadmaps do not adapt to how well a candidate performs on quizzes.
3. **Artificial Scoring:** General ATS checkers rely on keyword-stuffing hacks rather than semantic matching or experience validation.

**VidyaGuide AI** integrates these solutions into a unified, state-persistent career development ecosystem driven by **LangGraph** agent orchestration.

---

## 🏗️ System Architecture

The platform is designed around a decoupled client-server pattern. The client is a single-page React app interacting with a modular, asynchronous FastAPI backend. Deep reasoning and graph loops are controlled by LangGraph, backed by Firestore for state persistence.

```mermaid
graph TB
    %% Client Tier
    subgraph Client ["Client Layer (React / Vite)"]
        UI["React SPA Dashboard"]
        SpeechIn["Web Speech API (STT)"]
        SpeechOut["Synthesis API (TTS)"]
        FB_Auth["Firebase Authentication (Google Sign-In)"]
    end

    %% Network Gateway
    UI <-->|HTTPS / JSON| ServerAPI["FastAPI App Gateway"]

    %% Backend Tier
    subgraph Backend ["Backend Processing (FastAPI)"]
        ServerAPI --> RouterResume["Resume Router"]
        ServerAPI --> RouterCareer["Career Router"]
        ServerAPI --> RouterRoadmap["Roadmap Router"]
        ServerAPI --> RouterQuiz["Quiz Router"]
        ServerAPI --> RouterInterview["Interview Router"]
        
        RouterResume --> LG_Analysis["LangGraph Resume Analyzer"]
        RouterCareer --> LLM_Career["Career Rec Engine"]
        RouterRoadmap --> LG_Roadmap["Roadmap Generator"]
        RouterQuiz --> LG_Quiz["Quiz Engine (Gen & Eval)"]
        RouterInterview --> LG_Interview["LangGraph Mock Interviewer"]
    end

    %% AI Layer
    subgraph AI ["AI Agent Layer (Groq Model API)"]
        LLM_Model["Grok / LLM Model Engine"]
    end
    LG_Analysis <--> LLM_Model
    LLM_Career <--> LLM_Model
    LG_Roadmap <--> LLM_Model
    LG_Quiz <--> LLM_Model
    LG_Interview <--> LLM_Model

    %% Database & Storage
    subgraph Storage ["Persistence & Assets"]
        FS_DB[("Cloud Firestore")]
        Cloudinary[("Cloudinary Asset Store")]
    end
    
    UI -->|Direct Upload| Cloudinary
    Cloudinary -->|Secure URL| RouterResume
    
    FB_Auth -.->|Verify JWT| ServerAPI
    
    RouterResume <--> FS_DB
    RouterCareer <--> FS_DB
    RouterRoadmap <--> FS_DB
    RouterQuiz <--> FS_DB
    RouterInterview <--> FS_DB
```

---

## 🤖 Agentic Workflow

Each feature in VidyaGuide AI is managed by a specialized agent that operates on a Shared Graph State, making reasoning loops goal-oriented:

1. **Resume Analysis Agent:** Pulls the document text, extracts skills and structures education levels.
2. **Skill Gap Agent:** Compiles unmatched requirements and sorts them by career impact.
3. **Career Recommendation Agent:** Evaluates current profiles to propose match percentages, salaries, and target pathways.
4. **Roadmap Agent:** Structures customized learning modules, matching week-by-week goals with actual available study hours.
5. **Quiz Agent:** Evaluates candidate mastery on specific skills, scoring answers and awarding game points.
6. **Interview Agent:** Evaluates candidate speech responses, changes verbal difficulty levels, and compiles final hiring reports.
7. **Progress Tracking Agent:** Updates profile statistics, processes badges, and merges game points into the dashboard.

```mermaid
graph TD
    User([User Profile / Resume Upload]) --> ParserAgent[Resume Parsing Agent]
    ParserAgent --> JDAgent[JD Requirement Agent]
    JDAgent --> MatchAgent[Semantic Matcher Agent]
    MatchAgent --> GatingAgent{Required Skill Gate}
    
    %% Deterministic calculation
    GatingAgent -->|Pass / Fail| ATSCalc[ATS Gating Engine]
    ATSCalc --> GapAgent[Skill Gap Identifier Agent]
    
    %% Sequential loops
    GapAgent --> CareerAgent[Career Recommendation Agent]
    CareerAgent --> Selector{Role Selected?}
    
    Selector -->|Yes| RoadmapAgent[Roadmap Agent]
    RoadmapAgent --> QuizAgent[Quiz Generator Agent]
    QuizAgent --> QuizEval[Quiz Evaluation & Badge Agent]
    Selector -->|Yes| MockAgent[Adaptive Interview Agent]
    
    QuizEval --> ProgressAgent[Progress Tracking Agent]
    MockAgent --> ProgressAgent
```

---

## 🔀 LangGraph Orchestration

Traditional sequential APIs lack memory, struggle with nested logic (e.g., repeating a question if answers are too shallow), and fail to persist intermediate states. LangGraph resolves this by mapping cycles, managing state transformations, and running sandboxed steps.

We organize orchestrations into separate focused pipelines to avoid bloated schemas:

### Pipeline Graphs
* **Analysis Pipeline Graph:** Runs parsing, matching, scoring, gap analysis, recommendations, and automatically commits to Firestore.
* **Quiz Evaluation Pipeline Graph:** Computes MCQ scoring, recalculates total points, shifts user badges, and updates profile progress.
* **Mock Interview Pipeline Graph:** Runs a single-turn loop (generating questions, scoring candidate speech responses, routing to follow-ups, and compiling hiring manager reports).

### Unified Node Pipeline Lifecycle
The diagram below shows the conceptual flow of nodes and conditional checks throughout a user's career path optimization cycle:

```mermaid
flowchart TD
    START([Start Pipeline]) --> ResumeParserNode[resume_parser]
    ResumeParserNode --> JDParserNode[jd_parser]
    JDParserNode --> ResumeMatchNode[resume_match]
    ResumeMatchNode --> ATSScoreNode[ats_score]
    ATSScoreNode --> SkillGapNode[skill_gap]
    SkillGapNode --> RecommendationNode[recommendation]
    RecommendationNode --> SaveFirestoreNode[save_firestore]
    SaveFirestoreNode --> END1([End Analysis])

    %% Career Paths & Roadmaps
    START2([Start Career Path Selection]) --> CareerPathNode[career_path]
    CareerPathNode --> RoadmapNode[roadmap]
    RoadmapNode --> END2([End Roadmap Generation])

    %% Quiz Loops
    START3([Start Quiz Flow]) --> QuizGen[quiz_generation]
    QuizGen --> END3([Quiz Generated])
    
    START4([Submit Quiz Answers]) --> QuizEvalNode[quiz_evaluation]
    QuizEvalNode --> BadgeNode[badge]
    BadgeNode --> ProgressNode[progress]
    ProgressNode --> END4([Progress Updated])

    %% Interview Loop
    START5([Start Interview Session]) --> GenerateQuestionNode[generate_question]
    GenerateQuestionNode --> END5([Question Generated])
    
    START6([Submit Answer]) --> EvaluateAnswerNode[evaluate]
    EvaluateAnswerNode --> FollowupGate{followup_needed?}
    FollowupGate -->|True| GenerateFollowupNode[followup]
    FollowupGate -->|False| EndTurn([End Interview Turn])
    GenerateFollowupNode --> EndTurn
    
    START7([End Interview Session]) --> GenerateReportNode[report]
    GenerateReportNode --> END7([Report Compiled])
```

---

## 📊 Firestore Database Design

The system uses a highly structured Firestore schema with denormalized fields where read performance is prioritized.

### 1. `users`
* **Purpose:** Stores core user registration profiles and basic experience metrics.
* **JSON Schema:**
```json
{
  "name": "Koushik G",
  "email": "koushik@example.com",
  "photo_url": "https://lh3.googleusercontent.com/a/ac11b22",
  "college": "National Institute of Engineering",
  "resume_url": "https://res.cloudinary.com/cloudinary_name/image/upload/v1/resumes/uid.pdf",
  "experience_years": 2,
  "createdAt": "2026-06-09T14:10:00Z",
  "updatedAt": "2026-06-09T14:15:00Z"
}
```

### 2. `analysis_sessions`
* **Purpose:** Stores the results of resume analysis runs against job descriptions.
* **JSON Schema:**
```json
{
  "sessionId": "b47e5b22-83b6-4c48-8dfa-89a3a9bf0a2c",
  "uid": "user_firebase_uid_123",
  "resumeUrl": "https://res.cloudinary.com/cloudinary_name/image/upload/v1/resumes/uid.pdf",
  "jobDescription": "Looking for a Python Developer experienced in FastAPI and Docker...",
  "status": "completed",
  "atsScore": 68,
  "matchPercentage": 72.5,
  "matchedSkills": ["Python", "FastAPI", "REST APIs"],
  "missingSkills": ["Docker", "Kubernetes", "PostgreSQL"],
  "matchedPreferred": ["Git", "Agile"],
  "missingPreferred": ["Redis"],
  "matchedRequiredCount": 3,
  "totalRequiredCount": 6,
  "matchedPreferredCount": 2,
  "totalPreferredCount": 3,
  "educationScore": 100.0,
  "experienceScore": 66.7,
  "strengths": ["Solid FastAPI implementation history", "Strong back-end fundamentals"],
  "weaknesses": ["Lack of container orchestration (Docker/K8s) knowledge"],
  "recommendations": ["Learn Docker basics and structure multi-stage builds", "Set up PostgreSQL databases locally"],
  "createdAt": "2026-06-09T14:16:30Z"
}
```

### 3. `career_paths`
* **Purpose:** Persists career recommendations and track target role selections.
* **JSON Schema:**
```json
{
  "uid": "user_firebase_uid_123",
  "recommendedRoles": [
    {
      "title": "Backend Engineer",
      "match_percentage": 85,
      "salary_range": "$90K - $130K",
      "reason": "Aligned with Python and REST API strengths.",
      "certifications": ["AWS Developer Associate", "FastAPI Professional"]
    }
  ],
  "selectedRole": "Backend Engineer",
  "skillsContext": ["Python", "FastAPI", "REST APIs"],
  "missingSkillsContext": ["Docker", "Kubernetes", "PostgreSQL"],
  "sessionId": "b47e5b22-83b6-4c48-8dfa-89a3a9bf0a2c",
  "generatedAt": "2026-06-09T14:18:00Z"
}
```

### 4. `roadmaps`
* **Purpose:** Stores the customized weekly study modules generated by the Roadmap Agent.
* **JSON Schema:**
```json
{
  "uid": "user_firebase_uid_123",
  "role": "Backend Engineer",
  "learningPace": "Moderate",
  "progressPercentage": 25,
  "completedTopics": ["Week 1: Docker Basics"],
  "currentSkills": ["Python", "FastAPI"],
  "missingSkills": ["Docker", "Kubernetes"],
  "roadmap": [
    {
      "week": 1,
      "topic": "Week 1: Docker Basics",
      "description": "Learn multi-stage builds and container networking for Python apps.",
      "difficulty": "Intermediate",
      "estimated_hours": 18,
      "skill_gained": "Docker",
      "required_skills": ["Python"],
      "current_skills_used": ["Python"],
      "skill_alignment": ["Python Development"],
      "resources": ["Official Docker Docs", "Docker Deep Dive Book"]
    }
  ],
  "generatedAt": "2026-06-09T14:19:00Z"
}
```

### 5. `quiz_results`
* **Purpose:** Tracks individual skill testing records and point allocations.
* **JSON Schema:**
```json
{
  "uid": "user_firebase_uid_123",
  "skill": "Docker",
  "difficulty": "Medium",
  "correctAnswers": 8,
  "wrongAnswers": 1,
  "unattempted": 1,
  "score": 80.0,
  "pointsEarned": 39,
  "createdAt": "2026-06-09T14:22:00Z"
}
```

### 6. `interview_sessions`
* **Purpose:** Holds conversation logs and evaluations for interactive mock interviews.
* **JSON Schema:**
```json
{
  "uid": "user_firebase_uid_123",
  "session_id": "9c1221b0-464a-4e3a-9694-8ef825c56c2d",
  "role": "Backend Engineer",
  "status": "completed",
  "difficulty": "Advanced",
  "totalQuestions": 5,
  "overallScore": 7.8,
  "technicalAverage": 8.0,
  "communicationAverage": 7.5,
  "completenessAverage": 7.6,
  "confidenceAverage": 8.2,
  "strengths": ["Strong understanding of Docker layers", "Assertive articulation of technical trade-offs"],
  "weaknesses": ["Weak explanations of container volumes"],
  "recommendations": ["Revise Docker networking concepts", "Practice STAR formatting on scenario questions"],
  "hiringRecommendation": "Strong Hire",
  "interviewHistory": [
    {
      "question": "How do you optimize a Docker image size for a FastAPI application?",
      "question_type": "Technical",
      "difficulty": "Intermediate",
      "answer": "I use multi-stage builds and slim base images to ensure build tools are excluded.",
      "technical_score": 9,
      "communication_score": 8,
      "completeness_score": 8,
      "confidence_score": 9,
      "overall_score": 8.5,
      "feedback": "Excellent response detailing image layers and multi-stage pipelines.",
      "strengths": ["Multi-stage awareness"],
      "weaknesses": [],
      "followup_needed": false
    }
  ],
  "startedAt": "2026-06-09T14:25:00Z",
  "completedAt": "2026-06-09T14:31:00Z"
}
```

### 7. `user_progress`
* **Purpose:** Tracks cumulative points, achievements, and badge status.
* **JSON Schema:**
```json
{
  "uid": "user_firebase_uid_123",
  "totalPoints": 580,
  "badge": "Gold",
  "quizzesAttempted": 12,
  "updatedAt": "2026-06-09T14:31:00Z"
}
```

### 8. `agent_logs`
* **Purpose:** Tracks execution events in the agent workflow for diagnostics.
* **JSON Schema:**
```json
{
  "uid": "user_firebase_uid_123",
  "sessionId": "b47e5b22-83b6-4c48-8dfa-89a3a9bf0a2c",
  "node": "SaveToFirestoreNode",
  "action": "analysis_saved",
  "status": "success",
  "timestamp": "2026-06-09T14:16:32Z"
}
```

---

## 📁 Folder Structure

The project repository is split into isolated `frontend` and `backend` layers for clean development operations:

```
VidyaGuide-AI/
├── backend/                       # FastAPI Server Root
│   ├── agent/                     # LangGraph Core Orchestration
│   │   ├── __init__.py
│   │   ├── graph.py               # Compiles pipelines and StateGraphs
│   │   ├── state.py               # TypedDict schemas for Graphs
│   │   ├── nodes.py               # Base parsing/scoring/roadmap nodes
│   │   ├── interview_nodes.py     # Evaluation and adaptive interview nodes
│   │   └── llm.py                 # LLM configuration (Groq clients)
│   ├── routes/                    # API Route Definitions
│   │   ├── __init__.py
│   │   ├── resume.py              # Parsing endpoints and PDF downloader
│   │   ├── career.py              # Role suggestions & selections
│   │   ├── roadmap.py             # Custom schedule planners
│   │   ├── quiz.py                # Assessment generators
│   │   ├── progress.py            # User statistics summaries
│   │   ├── dashboard.py           # Dashboard data aggregation
│   │   ├── chat.py                # AI career coach assistant
│   │   └── interview.py           # Vocal mock interview loops
│   ├── .env.example               # Template for environment settings
│   ├── firebase_admin_init.py     # Admin SDK client connection
│   ├── main.py                    # Entry point loader
│   ├── pyproject.toml             # Python metadata configuration
│   ├── requirements.txt           # Package manifest
│   └── server.py                  # API router assembly and middleware
│
├── frontend/                      # React Application Root
│   ├── src/                       # React Source
│   │   ├── assets/                # Local graphic assets
│   │   ├── components/            # UI components
│   │   │   ├── Achievements.jsx   # Milestone levels and scores view
│   │   │   ├── CareerPaths.jsx    # Recommended roles panel
│   │   │   ├── Dashboard.jsx      # Aggregated dashboard UI
│   │   │   ├── EditProfile.jsx    # User settings modification form
│   │   │   ├── GoogleSignInModal.jsx # Auth portal modal popup
│   │   │   ├── LandingPage.jsx    # Hero visual page
│   │   │   ├── MockInterview.jsx  # Voice-enabled vocal interview panel
│   │   │   ├── ProfileForm.jsx    # Demographics and onboarding profile
│   │   │   ├── Progress.jsx       # Custom learning tracker
│   │   │   ├── Quiz.jsx           # Assessment test panel
│   │   │   ├── ResumeAnalysis.jsx # Upload panel and match statistics
│   │   │   └── Roadmap.jsx        # Custom scheduler view
│   │   ├── api.js                 # Network wrapper around fetch
│   │   ├── auth.js                # Auth helper logic
│   │   ├── firebase_config.js     # Client-side Firebase configurations
│   │   ├── index.css              # Globals and modern colors style
│   │   └── main.jsx               # React client engine loader
│   ├── package.json               # Node dependency packages
│   └── vite.config.js             # Vite compiler configurations
│
├── firestore.rules                # Production security guidelines
├── storage.rules                  # Cloudinary/Storage rules
└── firebase.json                  # Firebase hosting metadata
```

---

## 🔌 API Documentation

All API requests are prefixed with `/api`. Standard responses return JSON structures.

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/resume/analyze` | Parse resume PDF from Cloudinary URL and score against a JD | Yes |
| `POST` | `/api/career/recommend` | Propose recommended roles based on active skills profile | Yes |
| `POST` | `/api/career/custom` | Return custom job matching reports for user-provided roles | Yes |
| `POST` | `/api/career/select-role` | Select a target career path role for active roadmaps | Yes |
| `GET` | `/api/career/context/{uid}`| Get the latest parsed skills and gaps context | Yes |
| `GET` | `/api/career/{uid}` | Fetch current saved recommended roles list | Yes |
| `POST` | `/api/roadmap/generate` | Generate week-by-week personalized learning roadmaps | Yes |
| `GET` | `/api/roadmap/all/{uid}` | List all generated roadmaps for a user | Yes |
| `GET` | `/api/roadmap/{uid}` | Fetch active roadmap (optionally filter by `role`) | Yes |
| `POST` | `/api/roadmap/complete-topic`| Toggle completion status of a weekly topic (progress recalculated) | Yes |
| `DELETE`| `/api/roadmap/delete` | Delete a specific roadmap permanently | Yes |
| `POST` | `/api/quiz/generate` | Generate 10 difficulty-aware MCQs on a specific skill | Yes |
| `POST` | `/api/quiz/submit` | Evaluate quiz answers, calculate points, update badge | Yes |
| `GET` | `/api/quiz/history/{uid}` | List past quiz results | Yes |
| `GET` | `/api/progress/{uid}` | Get points tally, badge level, and quiz average score | Yes |
| `GET` | `/api/dashboard/{uid}` | Aggregated call returning profile, ATS, roadmap, and activity data | Yes |
| `POST` | `/api/chat/send` | Chat with the AI career coach | Yes |
| `POST` | `/api/interview/start` | Start an interview session and generate the first question | Yes |
| `POST` | `/api/interview/answer` | Evaluate response, adjust difficulty, generate next question/follow-up | Yes |
| `GET` | `/api/interview/report/{sid}`| Get final report with strengths, weaknesses, and hiring recommendations | Yes |
| `GET` | `/api/interview/history/{uid}`| Fetch all past mock interview sessions for a user | Yes |

---

## 📊 ATS Scoring Methodology

General keyword-based ATS checkers are easily cheated by hiding terms in white text. **VidyaGuide AI** uses a hybrid deterministic scoring logic:

1. **Semantic Parsing:** The LLM parses the candidate profile and requirements into unified concepts, solving synonyms (e.g., mapping "React.js" to "frontend framework").
2. **Deterministic Weighting:** The final ATS Score ($S_{ATS}$) is calculated mathematically in Python using specific weights:

$$\text{Score}_{\text{ATS}} = (S_{\text{Req}} \times 0.80) + (S_{\text{Pref}} \times 0.10) + (S_{\text{Edu}} \times 0.05) + (S_{\text{Exp}} \times 0.05)$$

* **Required Skills ($S_{\text{Req}}$):** Percentage of required skills matched.
* **Preferred Skills ($S_{\text{Pref}}$):** Percentage of preferred skills matched.
* **Education ($S_{\text{Edu}}$):** Scored based on meeting the minimum degree requirement. If the requirement is "Master" and candidate holds a "Bachelor", score scales down ($c_{\text{level}} / r_{\text{level}} \times 100$).
* **Experience ($S_{\text{Exp}}$):** Linear scaling up to $100\%$ when the candidate's years meet or exceed the required experience:

$$\min\left(\frac{\text{Years}_{\text{Candidate}}}{\text{Years}_{\text{Required}}}, 1.0\right) \times 100$$

### 🛡️ The Required Skills Gating Threshold
To prevent candidates with high experience or education from inflating their score without meeting the core skills, we apply a **Required Skill Gate** filter on the final score ($S_{ATS}$):

* **Ratio = 0%:** Gated to a maximum of **5** (Immediate rejection).
* **Ratio < 20%:** Score capped at **25**.
* **Ratio < 40%:** Score capped at **50**.
* **Ratio $\ge$ 40%:** Uncapped, fully calculation-based score.

---

## 🎙️ Mock Interview Evaluation Methodology

The interview engine operates like a live human dialogue, scoring answers across four distinct dimensions:

| Dimension | Weight | Criteria |
|:---|:---:|:---|
| **Technical Accuracy** | 40% | Core technical accuracy and correctness of concepts. |
| **Completeness** | 25% | Coverage of all target talking points requested in expected topics. |
| **Communication** | 20% | Structured formatting, clarity, and conciseness. |
| **Confidence** | 15% | Assertive phrasing (absence of filler words or uncertainty). |

```
Overall Turn Score = (Tech × 0.40) + (Completeness × 0.25) + (Comm × 0.20) + (Conf × 0.15)
```

### 📈 Adaptive Difficulty Adjustments
The system dynamically scales difficulty based on performance:
* **Turn Score $\ge$ 8.0:** Automatically upgrades the next question to **Advanced**.
* **Turn Score < 5.0:** Automatically downgrades the next question to **Beginner**.
* **Turn Score 5.0 - 7.9:** Maintains **Intermediate** level.

### 🔄 Follow-Up Logic
If the candidate's answer is shallow or misses core expectations ($followup\_needed = \text{true}$), the engine inserts a **follow-up question** probing the missing concepts instead of moving to a new topic.

---

## 🎖️ Badge & Scoring System

Candidates accumulate experience points ($XP$) by completing quizzes. Correct answers award points, while mistakes apply a small penalty.

$$\text{Quiz Points} = \max(0, \text{Correct} \times 5 - \text{Wrong} \times 1)$$

User levels are determined by lifetime points:

| Point Range | Badge Level | Description |
|:---:|:---:|:---|
| `0 - 250` | 🥉 **Bronze** | Getting started on basic fundamentals. |
| `251 - 500` | 🥈 **Silver** | Showing consistent improvement in skills. |
| `501 - 1000` | 🥇 **Gold** | Competent developer with foundational core skills. |
| `1001 - 1500` | 💎 **Diamond** | Strong technical capability across multiple domains. |
| `1501 - 2500` | 🏆 **Platinum** | Expert programmer ready for advanced roles. |
| `> 2500` | 👑 **Master** | Complete mastery of technical topics and domains. |

---

## 🧠 AI Components

### LLM Engine: Grok (via Groq API)
VidyaGuide AI uses **Grok** as its primary reasoning engine.

#### Why Grok?
1. **Low Latency:** High throughput ensures real-time speech responses during vocal mock interviews.
2. **Accurate JSON Parsing:** Structured JSON outputs are parsed reliably, preventing pipeline crashes.
3. **Context Retention:** Maintains context across long chat histories and multi-turn interviews.

---

## 🔒 Security

* **Firebase Authentication:** Handles secure user onboarding and sign-ins (Google OAuth).
* **Firestore Security Rules:** Access is restricted using identity-matching rules. Only the document owner can read or write data.
* **Input Validation:** Enforces strict Pydantic schemas on all FastAPI gateway endpoints.
* **Asset Upload Security:** Resumes are uploaded to Cloudinary over HTTPS with unsigned presets, restricting file types to valid PDFs.

### Production-Grade Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check ownership
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /user_progress/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /career_paths/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /roadmaps/{docId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.uid == request.auth.uid);
    }
    match /analysis_sessions/{sessionId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.uid == request.auth.uid);
    }
    match /quiz_results/{resultId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.uid == request.auth.uid);
    }
    match /interview_sessions/{sessionId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.uid == request.auth.uid);
    }
    match /agent_logs/{logId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;
    }
  }
}
```

---

## 🛠️ Installation Guide

### Prerequisites
* **Python** 3.10 or higher
* **Node.js** 18.x or higher
* **Firebase Project** (Console config credentials)
* **Cloudinary Account** (for resume storage)
* **Groq API Key** (for Grok inference)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env
```
Fill in the `.env` file with your credentials (see [Environment Variables](#environment-variables)). Place your Firebase service account JSON key as `serviceAccountKey.json` inside the `backend` directory.

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
```
Update the `.env` file with your Firebase and Cloudinary project settings (see [Environment Variables](#environment-variables)).

### 3. Run Applications
```bash
# Run FastAPI Backend (From backend directory)
python server.py

# Run React Client (From frontend directory in a new terminal)
npm run dev
```
The React frontend runs at `http://localhost:5173` and calls the FastAPI backend at `http://127.0.0.1:8000`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
GROQ_API_KEY=gsk_3x9K...
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
# Optional alternative setup:
# FIREBASE_PROJECT_ID=vidyaguide-ai
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://127.0.0.1:8000
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=vidyaguide-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vidyaguide-ai
VITE_FIREBASE_STORAGE_BUCKET=vidyaguide-ai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=8372...
VITE_FIREBASE_APP_ID=1:8372...
VITE_FIREBASE_MEASUREMENT_ID=G-QD...
VITE_CLOUDINARY_CLOUD_NAME=dyd...
VITE_CLOUDINARY_UPLOAD_PRESET=resumes_unsigned
```

---

## 🖼️ Application Screenshots

Here is a visual walkthrough of the **VidyaGuide AI** platform:

### 🏠 Onboarding & Authentication
* **Main Landing Page Hero Screen**
  ![Landing Page Hero](assets/landing-1.png)
* **Google Authentication Portal**
  ![Sign In Portal](assets/sign-in.png)
* **Landing Page Features & Features Tour**
  ![Landing Features Tour](assets/landing-2.png)
  ![Landing Career Insights](assets/landing-3.png)
  ![Landing Features List](assets/landing-4.png)

### 📊 Workspace & User Profiles
* **Unified Student Dashboard Workspace**
  ![Dashboard Workspace](assets/dashboard.png)
* **Onboarding Demographics & Profile Creation**
  ![Profile Onboarding](assets/profile.png)
* **Edit Profile Panel**
  ![Edit Profile Page](assets/edit-profile.png)
* **Account and API Settings Panel**
  ![Account Settings](assets/settings.png)

### 📄 Resume Parser & Semantic Matcher
* **JD Submission & Resume Parser Setup**
  ![Resume Analysis Setup](assets/resume-analysis-1.png)
* **Detailed Match Score Breakdown, Strengths & Recommendations**
  ![Resume Analysis Detail](assets/resume-analysis%202.png)

### 🛣️ Career Recommendation & roadmap Planners
* **AI Suggested Role Pathways & Salary Insights**
  ![Career Paths Suggestions](assets/career%20paths.png)
* **Personalized Weekly Step-by-Step Study Roadmap**
  ![Study Roadmap](assets/roadmap.png)

### ✏️ Interactive Skill Assessments & Achievements
* **Active Multiple Choice Quiz Panel**
  ![Active MCQ Quiz Panel](assets/quiz-1.png)
* **Quiz Results, Correct/Wrong Breakdown & XP Tally**
  ![Quiz Results Screen](assets/quiz-2.png)
* **Lifetime Points, Achievements & Badge Progression**
  ![Achievements Dashboard](assets/progress.png)

### 🎙️ Vocal Mock Interviews
* **Voice-Activated Active Interview Session Screen**
  ![Vocal Interview Screen](assets/interview-screen.png)
* **Alternative Interview Dialog view**
  ![Vocal Interview Dialog](assets/mock-interview.png)
* **Hiring Report, strengths & Weaknesses Assessment**
  ![Hiring Report Detail](assets/interview%20report.png)
* **Historic Mock Session Logs**
  ![Mock Interview Logs List](assets/interview-history.png)



---

## 🚀 Future Enhancements

* 📹 **Real-Time Video Mock Interviews:** Adds expression and emotion tracking using lightweight face meshes.
* 👔 **Interactive Resume Builder:** Live templates that recommend bullet points based on target ATS goals.
* 🔗 **LinkedIn Profile Scraper:** Auto-matching profiles with skills and recommendations.
* 🤖 **Autonomous Learning Assistant:** Inline chatbot to answer questions about roadmap topics.
* 🌍 **Localization Support:** Multi-language quiz generation and interview evaluations.

---

## ⚡ Technical Challenges Solved

1. **Complex PDF Text Extraction:** Built a backend PDF downloader with `pypdf` stream readers and fallback options to ensure files are parsed correctly.
2. **Semantic Skill Identification:** Trained the LLM to identify matching concepts (e.g. mapping "Postgres" to "relational databases") while keeping scoring calculations deterministic.
3. **Voice Interview Flow Management:** Combined Web Speech APIs with LangGraph state managers to handle voice inputs, TTS speech output, and adaptive difficulty.
4. **State Persistence:** Implemented Firestore transaction logs that write data securely without slowing down API performance.

---

## 💡 Why LangGraph?

Traditional LLM chains process instructions in one direction, making it hard to build complex agentic flows. LangGraph addresses this by introducing:
* **State Management:** Maintains variables across multiple nodes and API calls.
* **Cycles and Edges:** Supports looping back (e.g. asking follow-up questions) when responses don't meet expectations.
* **Scalable Agents:** Supports multiple agents working together on a single project.
* **Human-in-the-Loop Integration:** Supports pausing graph runs for manual inputs (e.g., grading written coding challenges).

---

## 🤖 Why This Is Agentic AI

Unlike simple chat tools, VidyaGuide AI uses **Agentic AI** design patterns:

* **Goal-Oriented Reasoning:** Solves complex goals (e.g. "Create a career development plan") by breaking them down into separate, logical steps.
* **Autonomous Operations:** Evaluates answers, adjusts difficulty, and recommends next steps without needing manual adjustments.
* **Intelligent Memory:** Keeps track of past performance and resume details across different sessions to customize future quizzes and interviews.
* **State Persistence:** Uses database state locks to manage multi-step processes reliably over long periods.

---

## 👥 Contributors

* **Koushik GKRV** — Lead Backend Developer & Agent Architect — [GitHub Profile](https://github.com/gkrvkoushik)
* Add your contributors here!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.