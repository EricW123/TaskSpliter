import { beforeEach, afterEach } from "vitest"
import { prisma } from "../lib/prisma"

beforeEach(async () => {
  await prisma.stage.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
})

afterEach(async () => {
  await prisma.stage.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
})
