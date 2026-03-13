import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { signToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(req: Request) {
    const { email, password } = await req.json()
  
    if (!email || !password) {
      return new Response("Missing email or password", { status: 400 })
    }
  
    const user = await prisma.user.findUnique({
      where: { email }
    })
  
    if (!user) {
      return new Response("Invalid credentials", { status: 401 })
    }
  
    const valid = await bcrypt.compare(password, user.passwordHash)
  
    if (!valid) {
      return new Response("Invalid credentials", { status: 401 })
    }
  
    const token = signToken(user.id)
  
    return Response.json({
      token
    })
  }