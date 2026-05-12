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

## Design System (Phase 5 — Premium Color Overhaul)

Color tokens live entirely in `client/src/index.css` via Tailwind v4 `@theme` block — no TSX changes needed for cascade.

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `gray-50` | `rgb(250,246,241)` warm cream | — | All page backgrounds |
| `gray-100` | `#edf2ee` | — | Sidebar hover, borders |
| `gray-900` | `#1a2619` deep forest | — | Dark cards |
| `gray-950` | `#121a12` | — | Dark page bg |
| `green-100` | `#CFFFDC` mint | — | Badge fills, light highlights |
| `green-200` | `#b3f0c7` | — | Spinner rings, soft borders |
| `green-400` | `#68BA7F` | — | Dark-mode accent |
| `green-500` | `#4CBB17` | — | Hover states |
| `green-600` | `#2E6F40` deep emerald | — | **Primary CTA, links, brand** |
| `green-700` | `#48872B` | — | Hover on CTAs |
| `green-800` | `#39542C` | — | Dark pressed states |
| `green-900` | `#293325` | — | Dark deep accents |
| `green-950` | `#253D2C` | — | Darkest green surface |

Pattern: **cream page → white card → content** = premium layered depth. Dark mode: `#121a12` page → `#1a2619` card.

## User Preferences

- Language: Hindi UI phrases preferred (e.g. "Sahi tha / Galat tha", "Aaj Ka Target", "Namaste")
- Bihar Board focus: all content specifically for Bihar Board exam pattern
- Chapter limit: 5 per user (enforced in DashboardPage)
- Question types: MCQ, 1M, 2M, 5M, Assertion-Reason, Case-Based, True/False, Fill Blanks, Exam Important
- Subject accent colors (blue/purple/orange for Physics/Chemistry/Math) intentionally kept as visual differentiators — do NOT apply brand green to subject colors
