import { describe, it, expect } from "vitest"

describe("delete project", () => {

  it("creates then deletes project", async () => {

    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: "delete@test.com",
        password: "123456"
      })
    })

    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: "delete@test.com",
        password: "123456"
      })
    })

    const { token } = await login.json()

    const create = await fetch("http://localhost:3000/api/projects", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: "Delete Test" })
    })

    const project = await create.json()

    const del = await fetch(
      `http://localhost:3000/api/projects/${project.id}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    )

    expect(del.status).toBe(200)

  })

})