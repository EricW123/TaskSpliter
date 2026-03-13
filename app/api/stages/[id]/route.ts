import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req)

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await context.params

  const stage = await prisma.stage.findUnique({
    where: { id },
    include: { project: true }
  })

  if (!stage) {
    return new Response("Stage not found", { status: 404 })
  }

  if (stage.project.userId !== userId) {
    return new Response("Forbidden", { status: 403 })
  }

  await prisma.stage.delete({
    where: { id }
  })

  return Response.json({ success: true })
}

async function updateParentCompletion(stageId: string) {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: {
        parentId: true
      }
    })
  
    if (!stage?.parentId) return
  
    const siblings = await prisma.stage.findMany({
      where: {
        parentId: stage.parentId
      },
      select: {
        completed: true
      }
    })
  
    const allCompleted = siblings.every(s => s.completed)
  
    await prisma.stage.update({
      where: { id: stage.parentId },
      data: { completed: allCompleted }
    })
  
    await updateParentCompletion(stage.parentId)
  }

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req)

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id } = await context.params

  const { title, completed, startDate, dueDate } = await req.json()
  console.log("Updating stage", { id, title, completed, startDate, dueDate })

  if (!title) {
    return new Response("Missing title", { status: 400 })
  }

  const stage = await prisma.stage.findUnique({
    where: { id },
    include: {
      project: true
    }
  })

  if (!stage) {
    return new Response("Stage not found", { status: 404 })
  }

  if (stage.project.userId !== userId) {
    return new Response("Forbidden", { status: 403 })
  }

  const updated = await prisma.stage.update({
    where: { id },
    data: {
        ...(title !== undefined ? { title } : {}),
        ...(completed !== undefined ? { completed } : {}),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
     }
  })

  if (completed !== undefined) {
    await updateParentCompletion(id)
  }

  return Response.json(updated)
}