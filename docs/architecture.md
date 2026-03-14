# System Architecture

TaskSplits v2 is a full-stack web application designed for hierarchical project planning.

## Tech Stack

Frontend:

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS

Backend:

- Next.js API routes

Database:

- Prisma ORM
- SQLite

AI Integration:

- Google Gemini API

CI/CD:

- GitHub Actions

---

## System Components

### Authentication

Users register and log in using JWT-based authentication.

Authentication flow:

User → Login/Register API → JWT issued → Token stored in browser → Authenticated API requests.

---

### Project Model

A user can create multiple projects.

User
└ Project

---

### Stage Tree

Projects are broken into hierarchical stages.

Project
└ Stage
└ Stage
└ Stage

Each stage can contain child stages, allowing unlimited nesting.

---

### Completion Propagation

Stage completion automatically propagates upward:

- If all children are complete → parent becomes complete
- If any child becomes incomplete → parent becomes incomplete

---

### Progress Calculation

Project progress is calculated recursively:

- Leaf nodes use `completed`
- Parent nodes average the completion of children

---

### AI Stage Suggestions

Users can generate stage plans using Gemini.

Flow:

User → AI Suggestion API → Gemini → JSON stage tree → Auto-create stages
