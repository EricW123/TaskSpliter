import { PrismaClient } from "@prisma/client"
import { getUserId } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const userId = getUserId(req)

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: { userId }
  })

  return Response.json(projects)
}

export async function POST(req: Request) {
  const userId = getUserId(req)

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { title } = await req.json()

  const project = await prisma.project.create({
    data: {
      title,
      userId
    }
  })

  return Response.json(project)
}