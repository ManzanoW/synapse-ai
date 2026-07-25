# 🧠 Synapse AI — Intelligent Study Copilot

**Synapse AI** is a full-stack, AI-powered study copilot built to optimize competitive exam preparation, academic routines, and active learning. The platform automates syllabus mapping (*editais*), generates flashcards with Spaced Repetition Systems (SRS), and provides structured study analytics.

[🚀 Live Demo](https://synapse-ai-opal-one.vercel.app) · [🐛 Report Bug](https://github.com/ManzanoW/synapse-ai/issues)

---

## 🚀 Key Features

* **AI-Powered Syllabus & Flashcard Generation:** Leverages **Gemini 3.5 Lite** to parse exam syllabi, map complex topics, and automatically build structured active recall flashcards.
* **Dynamic Flashcard Queue (SRS):** Interactive study interface using feedback-driven spacing algorithms (SM-2 inspired) for long-term retention.
* **Centralized Analytics Dashboard:** Tracks daily study progress, consistency streaks, subject-level mastery, and study time metrics.
* **Integrated Pomodoro Timer:** Focus session countdown timer with smooth state transitions (Focus, Short Break, Long Break).
* **Responsive & Native Dark Mode:** Minimalist, low-contrast UI built mobile-first with retractable drawer navigation.

---

## 🛠️ Architecture & Engineering Highlights

* **Atomic Transactions:** Uses `prisma.$transaction` to guarantee database consistency when generating multi-level structures (subjects, decks, and cards) in a single atomic operation.
* **Race Condition Prevention:** Robust backend safeguards preventing concurrent state mutation during automated AI batch operations.
* **State Persistence & Resilience:** Optimized client-side state hydration using `localStorage` to ensure seamless UX and fault tolerance across page reloads (F5 resilience).

---

## 💻 Tech Stack

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, Lucide React
* **Backend & Database:** Node.js, Prisma ORM, PostgreSQL / SQLite
* **AI Integration:** Google Gemini 3.5 Lite API
* **State Management:** React Context API & Reactive LocalStorage

---

## 📁 Core Directory Structure

```text
src/
├── app/                  # Next.js App Router (Dashboard, Review, API Routes)
│   ├── api/              # AI parsing & transaction endpoints
│   ├── dashboard/        # Main application dashboard
│   └── revisao/          # Active flashcard review engine
├── components/           # Reusable UI component library
│   ├── ui/               # Atomic design elements
│   ├── pomodoro-timer.tsx
│   ├── sidebar.tsx
│   └── subject-card.tsx
└── lib/                  # Core business logic, Prisma client, and custom hooks
    ├── prisma.ts         # Prisma ORM instance
    └── sidebar-context.tsx

```
## 👤 Author
Developed by João Vytor Manzano

GitHub: @ManzanoW
Linkedin: [joao-vytor](https://www.linkedin.com/in/joao-vytor/)
