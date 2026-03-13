# TaskSplits v2

TaskSplits is a lightweight project planning tool that allows users to break down projects into hierarchical stages and track their progress.

The application is built with **Next.js + TypeScript + Prisma + SQLite** and includes an AI feature for automatically generating stage suggestions.

---

## Features

- User registration and login (JWT authentication)
- Project management (create / delete projects)
- Hierarchical stage tree (unlimited nesting)
- Stage completion tracking with automatic parent updates
- Project progress calculation
- Start date and due date support
- AI stage suggestions using Google Gemini
- Basic CI pipeline with GitHub Actions
- Integration tests

---

## Running the Project

Install dependencies:

```bash
npm install
```

Add following environment variables in a `.env` file:

```
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your_secret
GEMINI_API_KEY=your_api_key_here
```

Start the development server:

```bash
npm run dev
```

The app will be available at: http://localhost:3000

## Running Tests

Run integration tests with:

```bash
npm run test
```

Tests cover:

- Authentication
- Project CRUD
- Stage CRUD
- Stage rename
- Stage completion
- Stage date updates

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
