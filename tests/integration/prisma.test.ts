import { describe, it, expect } from "vitest"
import { prisma } from "../../lib/prisma"

describe("prisma", () => {

  it("creates a user", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        passwordHash: "hash"
      }
    })

    expect(user.email).toBe("test@example.com")
  })

})