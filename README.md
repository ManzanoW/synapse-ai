# 🧠 Synapse AI — Intelligent Study Copilot

**Synapse AI** is a web and mobile (PWA) study organization application built on top of active recall and spaced repetition methodologies. Inspired by the sleek mechanics of modern AI-driven study platforms, this system was developed as a tailored, personal project to optimize exam preparation, competitive testing, and academic routines.

---

## 🚀 Current Features (Front-end MVP)

- **Centralized Dashboard:** A comprehensive overview featuring daily progress tracking, a consistency streak calendar, and performance metrics.
- **Integrated Pomodoro Timer:** A fully functional countdown timer supporting smooth state transitions between Focus (25 min), Short Break (5 min), and Long Break (15 min) intervals.
- **Dynamic Flashcard Queue:** An interactive active recall interface utilizing a streamlined feedback mechanism inspired by the SuperMemo-2 (SM-2) algorithm (Forgot, Hard, Easy).
- **Mobile-First Responsive Design:** A sidebar navigation system that fluidly collapses into a retractable drawer menu on mobile viewports.
- **Native Dark Mode:** A minimalist, low-contrast UI palette tailored for long, strain-free late-night study sessions.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Modern CSS design tokens using `@theme`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API (Global Sidebar viewport syncing)

---

## 📁 Core Directory Structure

```text
src/
├── app/                  # Next.js App Router structural pages and layouts
│   ├── dashboard/        # Main platform application layout
│   └── revisao/          # Active flashcard review page
├── components/           # Reusable UI component modules
│   ├── ui/               # Atomic building blocks (buttons, progress bars)
│   ├── pomodoro-timer.tsx
│   ├── sidebar.tsx
│   └── subject-card.tsx
└── lib/                  # Application core logic and custom React hooks
    └── sidebar-context.tsx