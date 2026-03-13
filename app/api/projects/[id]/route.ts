import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req)

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Needs to await params to make it "un-promised" in order to get `id` field from it
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id: id }
  })

  if (!project) {
    return new Response("Project not found", { status: 404 })
  }

  if (project.userId !== userId) {
    return new Response("Forbidden", { status: 403 })
  }

  await prisma.project.delete({
    where: { id: id }
  })

  return Response.json({ success: true })
}