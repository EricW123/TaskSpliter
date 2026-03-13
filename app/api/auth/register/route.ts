import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return new Response("Missing email or password", { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    return new Response("User already exists", { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash
    }
  })

  return Response.json({
    id: user.id,
    email: user.email
  })
}