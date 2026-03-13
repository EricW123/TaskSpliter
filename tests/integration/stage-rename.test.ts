import { describe, it, expect } from "vitest"

describe("rename stage", () => {

  it("renames a stage", async () => {

    const email = `rename-${Date.now()}@test.com`
    const password = "123456"

    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email,password})
    })

    const login = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email,password})
    })

    const {token} = await login.json()

    const projectRes = await fetch("http://localhost:3000/api/projects",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify({title:"Project"})
    })

    const project = await projectRes.json()

    const stageRes = await fetch("http://localhost:3000/api/stages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify({
        title:"Old Title",
        projectId:project.id
      })
    })

    const stage = await stageRes.json()

    const rename = await fetch(
      `http://localhost:3000/api/stages/${stage.id}`,
      {
        method:"PATCH",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({title:"New Title"})
      }
    )

    const updated = await rename.json()

    expect(updated.title).toBe("New Title")

  })

})