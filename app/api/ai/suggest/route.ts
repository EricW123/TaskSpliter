import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const { projectTitle } = await req.json()

  const prompt = `
You are a project planning assistant.

Break the following project into 4-6 stages.
Each stage may contain 0-4 substages.

Project: ${projectTitle}

Return ONLY valid JSON in the following format:

[
  {
    "title": "Stage name",
    "children": [
      {"title": "Subtask 1"},
      {"title": "Subtask 2"}
    ]
  }
]

Do not include explanations.
Return JSON only.
`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY || ""
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  )

  const data = await res.json()

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

  console.log("AI response:", text)
  let stages: string[] = []

  try {
    stages = JSON.parse(text)
  } catch {
    stages = []
  }

  return NextResponse.json({ stages })
}