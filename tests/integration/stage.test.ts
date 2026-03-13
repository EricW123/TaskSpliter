import { describe, it, expect } from "vitest"

async function registerAndLogin() {
  const email = `stage-${Date.now()}@test.com`
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
    body: JSON.stringify({ title: "Test Project" })
  })

  return res.json()
}

describe("Stage API", () => {

  it("creates a stage", async () => {
    const token = await registerAndLogin()
    const project = await createProject(token)

    const res = await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Stage 1",
        projectId: project.id,
        parentId: null
      })
    })

    expect(res.status).toBe(200)

    const stage = await res.json()

    expect(stage.title).toBe("Stage 1")
    expect(stage.projectId).toBe(project.id)
  })

  it("creates nested stages", async () => {
    const token = await registerAndLogin()
    const project = await createProject(token)

    const rootRes = await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Root Stage",
        projectId: project.id
      })
    })

    const root = await rootRes.json()

    const childRes = await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Child Stage",
        projectId: project.id,
        parentId: root.id
      })
    })

    const child = await childRes.json()

    expect(child.parentId).toBe(root.id)
  })

  it("lists stages for project", async () => {
    const token = await registerAndLogin()
    const project = await createProject(token)

    await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Stage A",
        projectId: project.id
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

    const stages = await res.json()

    expect(stages.length).toBe(1)
    expect(stages[0].title).toBe("Stage A")
  })

  it("deletes a stage", async () => {
    const token = await registerAndLogin()
    const project = await createProject(token)

    const create = await fetch("http://localhost:3000/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: "Delete Stage",
        projectId: project.id
      })
    })

    const stage = await create.json()

    const del = await fetch(
      `http://localhost:3000/api/stages/${stage.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    expect(del.status).toBe(200)
  })

})