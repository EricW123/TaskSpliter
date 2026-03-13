import { describe, it, expect } from "vitest"
import { signToken, verifyToken, getUserId } from "../../lib/auth"

describe("auth utils", () => {

  it("signs and verifies token", () => {
    const userId = "user123"

    const token = signToken(userId)
    const decoded = verifyToken(token)

    expect(decoded).toBe(userId)
  })

  it("returns null for invalid token", () => {
    const decoded = verifyToken("invalid-token")

    expect(decoded).toBeNull()
  })

})


describe("getUserId", () => {

  it("extracts user id from authorization header", () => {
    const token = signToken("abc123")

    const req = new Request("http://localhost", {
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    const userId = getUserId(req)

    expect(userId).toBe("abc123")
  })

})