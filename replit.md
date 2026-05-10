# Topper 2.0

AI-powered study platform for Bihar Board Class 11 & 12 Hindi-medium Science students.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 (port 5000)
- **Backend**: Node.js + Express + TypeScript (port 3001)
- **Auth + DB**: Firebase Auth + Firestore
- **AI**: NVIDIA NIM API — meta/llama-4-scout-17b-16e-instruct
- **State**: React Context (Auth, Theme, Progress)

## Architecture

- `client/src/` — React SPA
  - `pages/` — LandingPage, AuthPage, DashboardPage, UploadPage, ChapterPage, ProfilePage, ProgressPage
  - `components/` — Navbar, NotesView, QuestionsView, FlashCards, SimulationsView, FormulaSheet, MindMap, MistakesView, DoubtChat
  - `components/simulations/` — 11 interactive Physics/Chemistry simulations
  - `contexts/` — AuthContext, ThemeContext, ProgressContext
  - `lib/` — api.ts, firestore.ts
- `server/src/` — Express API
  - `routes/` — generate.ts, chat.ts, upload.ts, ncert.ts
  - `services/` — nvidia.ts (AI calls), prompts.ts (all prompt templates)

## Phase Summary

### Phase 1 — Core
- PDF upload + NCERT browser (class 11/12, Physics/Chemistry/Math/Biology)
- AI generates: detailed Notes, complete Question Bank (9 types)
- Firebase Auth (email + Google), Firestore storage
- Dark/Light mode, Hindi/English language detection

### Phase 2 — AI Enrichment
- Formula Sheet (LaTeX + variables + SI units)
- Interactive Concept Mind Map
- "Ye Galti Mat Karo" — top 10 common mistakes
- Flash Cards (25 per chapter, 3D flip, spaced repetition)
- Doubt Chat (AI tutor, Hindi/English)

### Phase 3 — Simulations
- 11 interactive 2D/3D simulations (projectile, SHM, electric field, wave interference, lens optics, Ohm's law, magnetic field, atomic orbitals, molecular structure, periodic trends, electrochemical cell)
- AI picks relevant simulations per chapter
- "Explain This" button — AI explains simulation state in real-time

### Phase 4 — Gamification & Progress
- **ProgressContext**: global badge-checking, streak management, daily goal tracking
- **ProfilePage** (`/profile`): editable profile (name/class/school/Bihar district), streak display, daily goal progress, exam countdown, auto-generated revision planner, 12-badge achievement grid, AI weak area analysis
- **ProgressPage** (`/progress`): overview stats, subject-wise accuracy bars, chapter-by-chapter progress cards (notes/questions/flashcards/sims)
- **DashboardPage**: streak + daily goal + accuracy strip, quick links to profile/progress
- **QuestionsView**: "Sahi tha / Galat tha" buttons appear after revealing each answer, tracks right/wrong per question
- **NotesView**: fires `onRead` callback after 1.5s (marks chapter notes as read)
- **FlashCards**: fires `onAllDone` when all cards marked Known (awards flashcard_pro badge)
- **SimulationsView**: fires `onSimLaunched` on first simulation launch
- **Badges (12)**: first_chapter, first_notes, q_10, q_50, q_100, q_250, streak_3, streak_7, streak_30, flashcard_pro, sim_explorer, all_sections
- **Weak Area AI** (`POST /api/generate/weakareas`): analyzes wrong questions per chapter, identifies specific weak topics, gives actionable Hindi/English advice
- **Revision Planner**: rule-based algorithm — sorts incomplete chapters by completion %, divides into weekly study plan based on days to exam

## User Preferences

- Language: Hindi UI phrases preferred (e.g. "Sahi tha / Galat tha", "Aaj Ka Target", "Namaste")
- Bihar Board focus: all content specifically for Bihar Board exam pattern
- Chapter limit: 5 per user (enforced in DashboardPage)
- Question types: MCQ, 1M, 2M, 5M, Assertion-Reason, Case-Based, True/False, Fill Blanks, Exam Important
