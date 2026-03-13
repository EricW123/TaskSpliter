import { describe, it, expect } from "vitest"

describe("register API", () => {
  it("should return success for new user", async () => {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test2@test.com",
        password: "123456"
      })
    })

    expect(res.status).toBe(200)
  })
})