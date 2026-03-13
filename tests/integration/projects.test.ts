import { describe, it, expect } from "vitest"

describe("projects API", () => {

  it("creates and lists projects", async () => {

    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: "proj@test.com",
        password: "123456"
      })
    })

    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: "proj@test.com",
        password: "123456"
      })
    })

    const { token } = await login.json()

    const create = await fetch("http://localhost:3000/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title: "Test Project" })
    })

    expect(create.status).toBe(200)

    const list = await fetch("http://localhost:3000/api/projects", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    const projects = await list.json()

    expect(projects.length).toBe(1)
  })

})