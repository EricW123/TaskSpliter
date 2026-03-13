import { title } from "process"
import { describe, it, expect } from "vitest"

async function registerAndLogin() {

  const email = `date-${Date.now()}@test.com`
  const password = "123456"

  await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })

  const login = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })

  const { token } = await login.json()

  return token
}

async function createProject(token: string) {

  const res = await fetch("http://localhost:3000/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title: "Date Test Project" })
  })

  return res.json()
}

describe("Stage dates", () => {

  it("creates stage with dates", async () => {

    const token = await registerAndLogin()
    const project = await createProject(token)

    const startDate = "2026-03-01"
    const dueDate = "2026-03-10"

    const res = await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Stage With Dates",
        projectId: project.id,
        startDate,
        dueDate
      })
    })

    expect(res.status).toBe(200)

    const stage = await res.json()

    expect(stage.startDate).toContain(startDate)
    expect(stage.dueDate).toContain(dueDate)
  })


  it("reads stage dates from GET /api/stages", async () => {

    const token = await registerAndLogin()
    const project = await createProject(token)

    const startDate = "2026-04-01"
    const dueDate = "2026-04-15"

    await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Stage Read Test",
        projectId: project.id,
        startDate,
        dueDate
      })
    })

    const res = await fetch(
      `http://localhost:3000/api/stages?projectId=${project.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    expect(res.status).toBe(200)

    const stages = await res.json()

    expect(stages.length).toBe(1)

    const stage = stages[0]

    expect(stage.startDate).toContain(startDate)
    expect(stage.dueDate).toContain(dueDate)
  })


  it("updates stage dates", async () => {

    const token = await registerAndLogin()
    const project = await createProject(token)

    const create = await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Stage Update Test",
        projectId: project.id
      })
    })

    const stage = await create.json()

    const newStart = "2026-05-01"
    const newDue = "2026-05-20"

    const update = await fetch(
      `http://localhost:3000/api/stages/${stage.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: "Stage Update Test",
          startDate: newStart,
          dueDate: newDue
        })
      }
    )

    expect(update.status).toBe(200)

    const updated = await update.json()

    expect(updated.startDate).toContain(newStart)
    expect(updated.dueDate).toContain(newDue)
  })

})