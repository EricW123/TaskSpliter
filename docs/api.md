# API Overview

## Auth

POST /api/auth/register  
POST /api/auth/login

---

## Projects

GET /api/projects  
POST /api/projects  
DELETE /api/projects/:id

---

## Stages

GET /api/stages?projectId=...  
POST /api/stages  
PATCH /api/stages/:id  
DELETE /api/stages/:id

---

## AI

POST /api/ai/suggest-stages
