# Project Overview

## Project Name: TaskSplits
Type: Personal-first long-term task breakdown tool
Environment: Claude Web Artifact (sandboxed runtime)

TaskSplits helps individuals structure long-term projects into stages and substages, track progress over time, and optionally export structured timelines (e.g., Google Calendar CSV). The system is client-side only and does not use a backend.

# 1. Project Context
## Tech Stack

- React (Functional Components)
- TypeScript (Strict Mode)
- No external state management libraries
- No backend (client-side only)
- localStorage for persistence
- Runs inside Claude Artifact sandbox

## TypeScript Requirements

- All data structures must use explicit interfaces
- No use of any
- All component props must be typed
- All utility functions must have explicit parameter and return types
- Dates must be stored as ISO strings (YYYY-MM-DD)

Example:
```typescript
interface Substage {
  id: string
  title: string
  description?: string
  completed: boolean
  endDate?: string
}

interface Stage {
  id: string
  title: string
  description?: string
  completed: boolean
  startDate?: string
  endDate?: string
  substages: Substage[]
}

interface Project {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  stages: Stage[]
}
```

Internal id fields must never be included in exported data.

# 2. Architecture Overview
## Component Structure

- App
- ProjectList
- ProjectView
- StageCard
- SubstageItem
- CreateProjectModal
- ImportModal
- ExportModal
- SuggestionPanel

## State Management Principles

- Single source of truth for selectedProjectId
- Draft state inside modals (commit only on Save)
- Never mutate state directly
- Always use immutable updates
- localStorage sync via useEffect

Do not introduce derived state unless explicitly required by version upgrade.

Completion logic must remain user-controlled unless Sprint milestone upgrades it.

## Hierarchy Constraint

- Two levels only:

Project → Stage → Substage

Do NOT convert to recursive tree structure.

# 3. Coding Standards

- PascalCase for components
- camelCase for variables and functions

Descriptive state names (e.g., selectedProjectId)

Avoid inline complex logic inside JSX

Keep components reasonably modular (< 200–250 lines when possible)

Do not mix UI logic and data transformation logic

No external UI frameworks

# 4. PRD & Design References
## Core Goals

- Stage-based progress structuring
- Clear long-term visibility
- Personal-first workflow
- Lightweight collaboration via export
- Google Calendar CSV export

## Non-Goals

- No real-time collaboration
- No OAuth integration
- No backend APIs
- No automatic AI task planning
- No recursive unlimited nesting

## Key UI Behaviors

- Sidebar project list
- Expandable stage cards
- Nested substages
- Modal-based create/edit
- No click-outside modal closing
- Delete requires confirmation
- Export must not include internal IDs
- Suggestions are advisory only

# 5. User Flow Requirements
## Create Project

- Open modal
- Enter project details
- Add stages inline
- Add substages inline
- Save once (atomic commit)

## Edit Stage

- Inline edit mode
- Controlled inputs
- Local state resets on cancel

## Import

- Validate JSON structure
- Regenerate IDs
- Prevent malformed JSON crashes

## Calendar Export

- Export entire project as CSV
- Each stage becomes one event
- No OAuth
- No external API calls

# 6. Scrum & Workflow Rules
## Branch Naming Convention

- feature/issue-number-description
- bug/issue-number-description
- chore/description

Example:
```
feature/42-stage-date-support
bug/18-export-sandbox-fix
```

## Commit Message Format
```
type(scope): short description
```

Examples:
```
feat(stage): add start and end date support
fix(export): remove id fields from CSV
refactor(modal): improve scroll behavior
```

Allowed types:

- feat
- fix
- refactor
- chore
- docs

## Referencing GitHub Issues

Use issue numbers to maintain traceability.

In commits:
```
Fixes #12
Closes #18
Related to #7
```

This links code changes to sprint issues and automatically closes them when merged.

## Pull Request Workflow

- Create branch from main
- Link PR to GitHub Issue
- Move issue to In Review column
- Verify manual test checklist
- Merge after verification

# 7. Testing Strategy

Formal automated tests are not required in Artifact environment.

Manual test checklist must verify:

- Project CRUD
- Stage CRUD
- Substage CRUD
- Title uniqueness validation
- Suggestion generation
- Import/export
- Google Calendar CSV compatibility
- localStorage persistence
- Modal scroll behavior
- Responsive layout

Target: All core flows manually validated.

# 8. Do’s and Don’ts
## Do

- Preserve architecture
- Keep scope minimal
- Regenerate IDs on import
- Validate user input
- Maintain responsive layout
- Keep exports clean (no internal fields)

## Don’t

- Introduce backend
- Add OAuth integration
- Convert to recursive tree
- Auto-derive completion logic without version upgrade
- Expose internal IDs in exported data
- Use browser APIs incompatible with sandbox

# 9. Environment Constraints

This app runs inside Claude Artifact (sandboxed runtime).

Be aware:

- File downloads may be restricted
- Clipboard APIs may require fallback
- No external authentication
- No server calls

All features must work entirely client-side.

# 10. Accessibility & Security

- All inputs must validate before saving
- JSON import must handle malformed data safely
- Buttons must be keyboard accessible
- Avoid color-only status indicators
- Use semantic HTML where possible

# 11. Change Protocol for AI-Assisted Features

Before modifying any data model:
- List affected interfaces
- List affected UI components
- List import/export impact
- List persistence impact
- Confirm no violation of non-goals

When implementing a feature:
- Prefer minimal incremental changes
- Do not refactor unrelated components
- Preserve naming and folder structure
- Do not introduce new abstractions without justification

## Final Principle

AI-assisted changes must:

- Preserve existing structure
- Respect non-goals
- Avoid scope expansion
- Maintain deterministic, predictable behavior
