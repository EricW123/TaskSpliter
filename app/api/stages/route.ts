import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"
import { Stage } from "@prisma/client"

export async function POST(req: Request) {
  const userId = getUserId(req)

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { title, projectId, parentId, startDate, dueDate } = await req.json()
  console.log("Creating stage with data:", { title, projectId, parentId, startDate, dueDate })

  if (!title || !projectId) {
    return new Response("Missing title or projectId", { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project || project.userId !== userId) {
    return new Response("Forbidden", { status: 403 })
  }

  const stage = await prisma.stage.create({
    data: {
      title,
      projectId,
      parentId: parentId || null,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null
    }
  })

  return Response.json(stage)
}

function buildTree(stages: Stage[]) {
    const map = new Map()
    const roots: Stage[] = []
  
    stages.forEach(s => map.set(s.id, {...s, children: []}))
  
    map.forEach(stage => {
      if (stage.parentId) {
        map.get(stage.parentId)?.children.push(stage)
      } else {
        roots.push(stage)
      }
    })
  
    return roots
}

export async function GET(req: Request) {
    const userId = getUserId(req)
  
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }
  
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
  
    if (!projectId) {
      return new Response("Missing projectId", { status: 400 })
    }
  
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
  
    if (!project || project.userId !== userId) {
      return new Response("Forbidden", { status: 403 })
    }
  
    const stages = await prisma.stage.findMany({
      where: { projectId },
      orderBy: { startDate: "asc" }
    })

    return Response.json(buildTree(stages))
}

