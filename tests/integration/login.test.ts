import { describe, it, expect } from "vitest"

describe("login API", () => {

  it("logs in successfully", async () => {

    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: "user@test.com",
        password: "123456"
      })
    })

    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: "user@test.com",
        password: "123456"
      })
    })

    expect(res.status).toBe(200)

    const data = await res.json()

    expect(data.token).toBeDefined()
  })

})