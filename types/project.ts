// model Project {
//     id        String   @id @default(cuid())
//     title     String
//     userId    String
//     createdAt DateTime @default(now())
  
//     user      User     @relation(fields: [userId], references: [id])
//     stages    Stage[]
//   }

import { Stage } from "./stage"

export type Project = {
    id: string
    title: string
    userId: string
    createdAt: string

    stages: Stage[]
}