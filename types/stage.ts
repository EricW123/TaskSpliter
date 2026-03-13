// model Stage {
//     id        String   @id @default(cuid())
//     title     String
//     projectId String
//     parentId  String?
  
//     startDate DateTime?
//     dueDate   DateTime?
//     completed Boolean  @default(false)
  
//     project   Project  @relation(fields: [projectId], references: [id])
  
//     parent    Stage?   @relation("StageTree", fields: [parentId], references: [id])
//     children  Stage[]  @relation("StageTree")
//   }

import { Project } from "./project"

export type Stage = {
    id: string
    title: string
    projectId: string
    parentId?: string | null

    startDate?: string | null
    dueDate?: string | null
    completed: boolean

    project: Project
    children: Stage[]
}