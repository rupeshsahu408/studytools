# Topper 2.0 — Complete Project Plan & Roadmap

## Project Overview

**Topper 2.0** is an AI-powered study platform built specifically for:
- **Bihar Board** Class 11th and 12th students
- **Hindi-medium** students (Hindi-first, English toggle available)
- **Science stream** — Physics and Chemistry (NCERT syllabus)

The core idea: A student uploads a PDF of any NCERT chapter, and the platform instantly transforms it into a complete study package — structured notes, all types of practice questions, formula sheets, mind maps, interactive 3D simulations, and more. The goal is to take a beginner student and help them become a topper.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (TypeScript) |
| Styling | Tailwind CSS — primary color: Green |
| Animations | Framer Motion (subtle, non-distracting) |
| Backend | Node.js + Express |
| AI Engine | NVIDIA NIM API (OpenAI-compatible, base URL: `https://integrate.api.nvidia.com/v1`) |
| Primary LLM | `meta/llama-4-scout-17b-16e-instruct` (or Nemotron/Qwen for Hindi) |
| PDF Parsing | `pdf-parse` (Node.js) |
| 3D Simulations | Three.js + React Three Fiber |
| Auth | Firebase Authentication (Google OAuth + Email/Password with email verification) |
| Database | Firebase Firestore (saves chapters, notes, questions per user) |
| Storage | Firebase Storage (uploaded PDFs) |
| Port | Frontend: 5000 / Backend: 3001 |

---

## NVIDIA NIM API Details

- **Base URL:** `https://integrate.api.nvidia.com/v1`
- **Auth:** `Bearer nvapi-YOUR_KEY_HERE`
- **API Style:** Fully OpenAI SDK-compatible (`/v1/chat/completions`)
- **Key stored as:** `NVIDIA_API_KEY` environment variable
- **Models to use:**
  - Text generation / Notes / Questions: `meta/llama-4-scout-17b-16e-instruct`
  - Fallback / Hindi-heavy tasks: `qwen/qwen3-235b-a22b` (strong multilingual)
  - Vision (future): `nvidia/llama-3.2-11b-vision-instruct`

---

## UI/UX Guidelines

- **Primary color:** Green (`#16a34a` / Tailwind `green-600`)
- **Theme:** Clean, modern, distraction-free — students should focus on studying
- **Animations:** Smooth but minimal — page transitions, loading states, card reveals
- **Language:** English UI (buttons, menus, navigation); all AI-generated content (notes, questions, explanations) in Hindi by default with English toggle
- **Typography:** Clear, readable — larger font sizes for content areas
- **Responsive:** Mobile-friendly (many Bihar students use phones)

---

## Project File Structure (Target)

```
topper-2.0/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # Base components (Button, Card, Badge, etc.)
│   │   │   ├── layout/            # Navbar, Sidebar, Layout wrapper
│   │   │   ├── upload/            # PDF upload component
│   │   │   ├── notes/             # Notes display components
│   │   │   ├── questions/         # Question bank components
│   │   │   ├── simulations/       # Three.js simulation components
│   │   │   └── chat/              # Doubt solver chat component
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── Home.tsx           # Landing / upload page
│   │   │   ├── Dashboard.tsx      # After upload — shows all generated content
│   │   │   ├── Notes.tsx          # Full notes view
│   │   │   ├── Questions.tsx      # Full question bank view
│   │   │   ├── Simulations.tsx    # 3D simulation browser
│   │   │   └── Chat.tsx           # Doubt solver chat
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Utility functions, API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                        # Node.js + Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── upload.ts          # PDF upload + text extraction
│   │   │   ├── generate.ts        # AI generation endpoints
│   │   │   └── chat.ts            # Doubt solver chat endpoint
│   │   ├── services/
│   │   │   ├── nvidia.ts          # NVIDIA NIM API client
│   │   │   ├── pdf.ts             # PDF parsing service
│   │   │   └── prompts.ts         # All AI prompt templates
│   │   ├── middleware/
│   │   └── index.ts               # Express app entry
│   ├── uploads/                   # Uploaded PDF files (temp)
│   └── package.json
│
└── PLAN.md                        # This file
```

---

## Phases Overview

| Phase | Name | Status |
|---|---|---|
| Phase 1 | Foundation — Upload + Notes + Questions | ⬜ Not Started |
| Phase 2 | Enrichment — Formulas, Mind Map, Flash Cards, Doubt Chat | ⬜ Not Started |
| Phase 3 | Simulations — Interactive 3D Physics & Chemistry | ⬜ Not Started |
| Phase 4 | Personalization — Progress, Streaks, Weak Areas | ⬜ Not Started |
| Phase 5 | Community — Teachers, Sharing, Leaderboard | ⬜ Not Started |

---

---

# PHASE 1 — Foundation

**Goal:** A student can upload an NCERT PDF chapter and instantly receive structured notes and a complete question bank. This is the core value proposition of the platform.

**Status:** ⬜ Not Started

---

## Phase 1 — Features to Build

### 1.1 — PDF Upload
- [ ] Drag-and-drop + click-to-browse PDF upload UI
- [ ] File size validation (max 20MB)
- [ ] Show upload progress bar
- [ ] Backend receives PDF, saves temporarily
- [ ] `pdf-parse` extracts raw text from PDF
- [ ] Text is cleaned and structured for AI processing
- [ ] User selects: Subject (Physics / Chemistry) + Class (11 / 12) + Chapter name

### 1.2 — AI Notes Generation
- [ ] Backend sends extracted text to NVIDIA NIM API
- [ ] AI generates structured chapter notes in **Hindi** containing:
  - Chapter overview / introduction
  - All topics and subtopics with explanations
  - Key concepts highlighted (bold/marked)
  - Important definitions
  - Real-world examples for each concept
- [ ] Notes displayed beautifully on frontend
- [ ] Bilingual toggle — switch any section between Hindi and English
- [ ] Download notes as PDF option

### 1.3 — Question Bank Generation
- [ ] AI generates the following question types from the chapter:
  - **Objective (MCQ)** — 4 options, correct answer marked — minimum 20 questions
  - **1-Mark Questions** — short factual — minimum 15 questions
  - **2-Mark Questions** — brief explanation — minimum 15 questions
  - **5-Mark Questions** — detailed answers (Bihar Board style) — minimum 10 questions
  - **Assertion-Reason** — new Bihar Board pattern — minimum 8 questions
  - **Case-Based Questions** — paragraph + 4 questions — minimum 3 sets
  - **True/False** — minimum 10 questions
  - **Fill in the Blanks** — minimum 10 questions
  - **Important Exam-Style Questions** — AI identifies the most likely board exam questions
- [ ] Each question has: question text, answer, explanation
- [ ] Questions filterable by type
- [ ] "Practice Mode" — hide answers, reveal on click
- [ ] Download full question bank as PDF

### 1.4 — Dashboard
- [ ] After upload + generation, user lands on chapter dashboard
- [ ] Shows: Chapter name, subject, class, generation timestamp
- [ ] Cards for each section: Notes, Questions, (future: Formulas, Mind Map, Simulations)
- [ ] Shows count of questions generated per type
- [ ] Smooth loading states while AI generates content (streaming responses preferred)

### 1.5 — Home / Landing Page
- [ ] Clean hero section explaining what Topper 2.0 does
- [ ] Upload area prominent and central
- [ ] Short list of what gets generated (notes, questions, simulations, etc.)
- [ ] Green color theme, subtle animations

---

## Phase 1 — API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload PDF, extract text, return `chapterId` |
| POST | `/api/generate/notes` | Generate structured notes for a chapter |
| POST | `/api/generate/questions` | Generate full question bank |
| GET | `/api/chapter/:id` | Get all generated content for a chapter |

---

## Phase 1 — AI Prompt Guidelines

All prompts must instruct the AI to:
- Respond in **Hindi** (Devanagari script) by default
- Follow **NCERT syllabus** and **Bihar Board exam pattern**
- Use **simple language** appropriate for Class 11/12 students
- Structure output as **clean JSON** for easy frontend rendering
- For notes: use markdown-style formatting (headings, bold, bullets)
- For questions: include question, answer, and a short explanation

---

## Phase 1 — Acceptance Criteria (Definition of Done)

- [ ] User can upload any NCERT Physics or Chemistry PDF chapter
- [ ] Text is extracted accurately from the PDF
- [ ] Notes are generated in Hindi with proper structure
- [ ] All 9 question types are generated with correct format
- [ ] Dashboard displays everything cleanly
- [ ] Bilingual toggle works on notes
- [ ] Practice mode works on questions (hide/reveal answers)
- [ ] No crashes or unhandled errors
- [ ] App runs on port 5000 (frontend) and 3001 (backend)
- [ ] NVIDIA API key loaded from environment variable (never hardcoded)

---

---

# PHASE 2 — Enrichment

**Goal:** Make the study material richer with formula sheets, concept mind maps, common mistake warnings, flash cards, and an AI doubt solver chat.

**Status:** ⬜ Not Started (Blocked by Phase 1 completion)

---

## Phase 2 — Features to Build

### 2.1 — Formula Sheet
- [ ] AI extracts every formula from the chapter
- [ ] Each formula shown with: formula, variables explained, SI unit, derivation hint
- [ ] Formatted with proper math rendering (KaTeX or MathJax)
- [ ] Downloadable as a printable formula sheet

### 2.2 — Concept Mind Map
- [ ] AI generates a JSON tree of chapter concepts and their relationships
- [ ] Frontend renders it as an interactive visual mind map
- [ ] Clickable nodes expand to show a short explanation
- [ ] Library: React Flow or D3.js

### 2.3 — "Ye Galti Mat Karo" (Common Mistakes Section)
- [ ] AI identifies the top 10 most common student mistakes in this chapter
- [ ] Displayed as warning cards with: mistake description + correct approach
- [ ] Specific to Bihar Board exam marking patterns

### 2.4 — Flash Cards
- [ ] AI generates 20-30 flash cards per chapter
- [ ] Card front: concept/term/formula | Card back: explanation
- [ ] Flip animation on click
- [ ] Spaced repetition tracking (mark as "Known" / "Need Review")
- [ ] Quick revision mode — go through all cards in sequence

### 2.5 — Doubt Solver Chat
- [ ] Chat UI on the chapter dashboard
- [ ] Student types any question about the chapter
- [ ] AI answers in Hindi, references the chapter content
- [ ] Supports follow-up questions (multi-turn conversation)
- [ ] Shows "Thinking..." animation while generating response
- [ ] Chat history saved per chapter session

---

## Phase 2 — Additional API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate/formulas` | Extract and format all formulas |
| POST | `/api/generate/mindmap` | Generate concept mind map JSON |
| POST | `/api/generate/mistakes` | Generate common mistakes list |
| POST | `/api/generate/flashcards` | Generate flash cards |
| POST | `/api/chat` | Doubt solver — multi-turn chat with chapter context |

---

## Phase 2 — Acceptance Criteria

- [ ] Formula sheet renders math correctly (no broken symbols)
- [ ] Mind map is interactive and readable
- [ ] Common mistakes section has at least 8 items per chapter
- [ ] Flash cards flip animation works smoothly
- [ ] Doubt chat responds in Hindi accurately within 10 seconds
- [ ] Chat maintains context across at least 10 turns

---

---

# PHASE 3 — Simulations

**Goal:** For every topic in the chapter that can be visualized, generate an interactive 3D simulation so students can *see* and *feel* the concept instead of just reading it.

**Status:** ⬜ Not Started (Blocked by Phase 2 completion)

---

## Phase 3 — Features to Build

### 3.1 — Simulation Catalog
- [ ] AI analyzes the chapter and identifies all topics that can be simulated
- [ ] Each topic gets a simulation card with: title, what it demonstrates, launch button
- [ ] Simulations organized by topic order in the chapter

### 3.2 — Physics Simulations (Examples)
- [ ] **Electric Field Lines** — place charges, see field lines update in real time
- [ ] **Projectile Motion** — adjust angle/velocity, see trajectory arc
- [ ] **Wave Optics** — single/double slit diffraction patterns
- [ ] **Lens & Mirrors** — move object, see image formation
- [ ] **Magnetic Field** — current-carrying wire, solenoid field visualization
- [ ] **Ohm's Law** — adjust resistance/voltage, see current change
- [ ] **Simple Harmonic Motion** — spring-mass, pendulum animation

### 3.3 — Chemistry Simulations (Examples)
- [ ] **3D Molecular Structures** — rotate and zoom molecules (using molecule data)
- [ ] **Atomic Orbitals** — s, p, d orbital 3D shapes
- [ ] **Periodic Trends** — interactive periodic table with trend visualization
- [ ] **Titration Curve** — adjust volume, see pH curve update
- [ ] **Electrochemical Cell** — electron flow animation

### 3.4 — Simulation Controls
- [ ] Each simulation has labeled sliders/buttons to change parameters
- [ ] Real-time visual update as parameters change
- [ ] "Explain This" button — AI explains what is being shown in Hindi
- [ ] Reset button to return to default state

---

## Phase 3 — Acceptance Criteria

- [ ] At least 5 simulations available for any Physics chapter
- [ ] At least 3 simulations available for any Chemistry chapter
- [ ] All simulations run smoothly at 30+ FPS
- [ ] Parameter controls work without lag
- [ ] "Explain This" gives a clear Hindi explanation
- [ ] Works on mobile (touch controls for 3D rotation)

---

---

# PHASE 4 — Personalization

**Goal:** Track what the student has studied, identify weak areas, and give them a personalized study plan.

**Status:** ⬜ Not Started (Blocked by Phase 3 completion)

---

## Phase 4 — Features to Build

### 4.1 — User Accounts
- [ ] Simple signup/login (email + password)
- [ ] Student profile: name, class (11/12), school, district (Bihar)
- [ ] All generated content saved to account

### 4.2 — Progress Tracker
- [ ] Dashboard showing all chapters uploaded and studied
- [ ] Per chapter: notes read ✓, questions practiced ✓, flash cards done ✓, simulations seen ✓
- [ ] Overall completion percentage per subject

### 4.3 — Weak Area Detection
- [ ] Track which questions the student gets wrong in practice mode
- [ ] AI identifies weak topics based on wrong answers
- [ ] Shows: "Tumhara ye topic weak hai — aaj isko dobara padho"
- [ ] Suggests which chapters to revise

### 4.4 — Study Streaks & Gamification
- [ ] Daily study streak counter
- [ ] Badges for milestones (First chapter, 7-day streak, 100 questions practiced, etc.)
- [ ] "Aaj ka target" — daily study goal

### 4.5 — Exam Countdown & Revision Planner
- [ ] Student sets their board exam date
- [ ] Platform calculates days remaining
- [ ] Suggests a chapter-wise revision schedule
- [ ] "Bihar Board mein 30 din bacha hai — ye chapters complete karo"

---

## Phase 4 — Acceptance Criteria

- [ ] User data persists across sessions
- [ ] Progress tracker updates after each activity
- [ ] Weak area detection works after at least 20 questions answered
- [ ] Streak counter resets if student doesn't study for a day
- [ ] Revision planner generates a realistic schedule

---

---

# PHASE 5 — Community

**Goal:** Build a community layer so teachers can contribute, students can share, and there's a healthy competitive environment.

**Status:** ⬜ Not Started (Blocked by Phase 4 completion)

---

## Phase 5 — Features to Build

### 5.1 — Teacher Mode
- [ ] Teachers can create an account with "Teacher" role
- [ ] Teachers upload chapters for their class/school
- [ ] Students can join a teacher's class and access their uploaded chapters
- [ ] Teacher can see student progress

### 5.2 — Note & Question Sharing
- [ ] Students can share their generated notes with classmates
- [ ] "Class library" — shared resources for a batch

### 5.3 — Leaderboard
- [ ] Weekly leaderboard by questions practiced and streaks
- [ ] Filter by district (Bihar), school, or class
- [ ] "Top Toppers of Bihar" section

### 5.4 — Discussion Forum (per chapter)
- [ ] Students can post doubts or tips on each chapter
- [ ] Other students or AI can answer
- [ ] Upvote helpful answers

---

---

## Environment Variables Required

```
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxx    # NVIDIA NIM API key
PORT=3001                               # Backend port
VITE_API_URL=http://localhost:3001      # Frontend → Backend URL
```

---

## Key Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| NVIDIA NIM API | User already has the key; OpenAI-compatible so easy to swap models |
| Hindi-first | Target audience is Hindi-medium Bihar Board students |
| PDF upload (Phase 1) | Most NCERT PDFs are freely available; easier than photo OCR |
| Node.js backend | JavaScript full-stack = faster development, easy JSON handling |
| Three.js simulations | Best web-based 3D library; works in browser without install |
| Green theme | User's explicit preference; also associated with growth/learning |
| Phase-by-phase | Each phase is independently testable and deliverable |

---

## What Has Been Built

> This section should be updated after each phase is completed.

- [ ] Phase 1 — Not yet built
- [ ] Phase 2 — Not yet built
- [ ] Phase 3 — Not yet built
- [ ] Phase 4 — Not yet built
- [ ] Phase 5 — Not yet built

---

## Current Status

**Active Phase:** Ready to begin Phase 1

**Next Action:** Set up project structure, install dependencies, configure NVIDIA API, build PDF upload and AI generation pipeline.

---

*Last updated: Phase 0 — Planning complete. Ready to build.*
