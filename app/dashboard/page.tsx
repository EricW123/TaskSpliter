"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Project = {
  id: string
  title: string
}

type StageNode = {
  id: string
  title: string
  parentId: string | null
  children: StageNode[]
  completed: boolean
  startDate: string | null
  dueDate: string | null
}

export default function Dashboard() {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const [newProjectTitle, setNewProjectTitle] = useState("")

  const [stages, setStages] = useState<StageNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const router = useRouter()

  /* ---------------- Projects ---------------- */
  /* ---------------- Projects ---------------- */

  async function loadProjects() {
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    setProjects(data)
  }

  async function createProject() {
    if (!newProjectTitle) return

    await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: newProjectTitle })
    })

    setNewProjectTitle("")
    loadProjects()
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })

    if (selectedProject === id) {
      setSelectedProject(null)
      setStages([])
    }

    loadProjects()
  }

  /* ---------------- Stages ---------------- */

  async function loadStages(projectId: string) {
    const res = await fetch(`/api/stages?projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    setStages(data)
  }

  async function createStage(parentId: string | null) {

    const title = prompt("Stage title")
    if (!title) return

    await fetch("/api/stages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        projectId: selectedProject,
        parentId
      })
    })

    loadStages(selectedProject!)
  }

  async function deleteStage(id: string) {

    await fetch(`/api/stages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })

    loadStages(selectedProject!)
  }

  async function renameStage(id: string) {

    await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: editingTitle
      })
    })

    setEditingStage(null)
    loadStages(selectedProject!)
  }

  /* ---------------- Tree helpers ---------------- */

  function computeProgress(node: StageNode): number {

    if (node.children.length === 0) {
      return node.completed ? 1 : 0
    }
  
    let sum = 0
  
    for (const child of node.children) {
      sum += computeProgress(child)
    }
  
    return sum / node.children.length
  }

  function computeProjectProgress(stages: StageNode[]): number {

    if (stages.length === 0) return 0
  
    let sum = 0
  
    for (const stage of stages) {
      sum += computeProgress(stage)
    }
  
    return sum / stages.length
  }

  const projectProgress = computeProjectProgress(stages)

  const progressPercent = Math.round(projectProgress * 100)

  async function toggleComplete(id: string, title: string, completed: boolean) {

    await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, completed })
    })
  
    loadStages(selectedProject!)
  }

  function toggleExpand(id: string) {

    const copy = new Set(expanded)

    if (copy.has(id)) copy.delete(id)
    else copy.add(id)

    setExpanded(copy)
  }

  async function updateDates(
    id: string, title: string,
    dates: { startDate?: string; dueDate?: string }
  ) {
    await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, ...dates })
    })
  
    loadStages(selectedProject!)
  }

  async function generateSuggestions() {

    if (!selectedProject) return
  
    const project = projects.find(p => p.id === selectedProject)
  
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectTitle: project?.title
      })
    })
  
    const data = await res.json()
  
    for (const title of data.stages) {
  
      await fetch("/api/stages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          projectId: selectedProject,
          parentId: null
        })
      })
    }
  
    loadStages(selectedProject)
  }

  function renderStage(stage: StageNode) {

    const isOpen = expanded.has(stage.id)

    const progress = computeProgress(stage)
    const percent = Math.round(progress * 100)

    const isOverdue = stage.dueDate && !stage.completed && new Date(stage.dueDate) < new Date();
    const isDueSoon = stage.dueDate && !stage.completed && !isNaN(new Date(stage.dueDate).getTime()) && new Date(stage.dueDate).getTime() - Date.now() <= 86400000 && new Date(stage.dueDate).getTime() - Date.now() > 0;

    return (
      <div key={stage.id} className="ml-4 mt-2">

        <div className="flex items-center gap-2">

          <button
            className="text-xs w-5 text-gray-700"
            onClick={() => toggleExpand(stage.id)}
          >
            {stage.children.length > 0
              ? (isOpen ? "▼" : "▶")
              : ""}
          </button>

          {editingStage === stage.id ? (
            <>
              <input
                aria-label="Edit stage title"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="border px-1"
              />

              <button
                className="text-green-600 text-xs"
                onClick={() => renameStage(stage.id)}
              >
                save
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <input
                aria-label="Mark stage as completed"
                type="checkbox"
                checked={stage.completed}
                onChange={() => {
                  toggleComplete(stage.id, stage.title, !stage.completed);
                  loadStages(selectedProject!);
                }}
                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div
                className={`cursor-pointer text-gray-900 font-medium min-w-[80px] inline-block border-2 rounded px-1 py-0.5 hover:shadow ${isOverdue ? 'border-red-500 text-red-600' : isDueSoon ? 'border-yellow-500 text-yellow-600' : 'border-gray-300'}`}
                onDoubleClick={() => {
                  setEditingStage(stage.id)
                  setEditingTitle(stage.title)
                }}
              >
                {stage.title}
              </div>
            </div>
          )}

            <div className="flex gap-2 text-xs mt-1">

            {/* <input
              type="date"
              className="border border-gray-300 p-2 w-full mb-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700 text-sm"
              placeholder="Start date"
              value={stage.startDate?.slice(0,10) || ""}
              onChange={(e) =>
                updateDates(stage.id, { startDate: e.target.value })
              }
            /> */}

            <input
              type="date"
              className="border border-gray-300 p-2 w-full mb-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700 text-sm"
              placeholder="End date"
              value={stage.dueDate?.slice(0,10) || ""}
              onChange={(e) => {
                updateDates(stage.id, stage.title, { dueDate: e.target.value });
                loadStages(selectedProject!);
              }}
            />

            </div>

          <span className="text-xs text-gray-500">
            ({percent}%)
          </span>

          <button
            className="text-blue-500 text-xs"
            onClick={() => createStage(stage.id)}
          >
            +child
          </button>

          <button
            className="text-red-500 text-xs"
            onClick={() => deleteStage(stage.id)}
          >
            delete
          </button>

        </div>

        {isOpen && stage.children.map(renderStage)}

      </div>
    )
  }

  /* ---------------- Effects ---------------- */

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadStages(selectedProject)
    }
  }, [selectedProject])

  /* ---------------- UI ---------------- */

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="flex-1 border-r bg-gray-100 shadow-md p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          TaskSplits Dashboard
        </h1>

        {/* Project Creation */}
        <div className="flex gap-2 mb-6">
          <input
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="New project"
            className="border px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button
            onClick={createProject}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Project List */}
        <div className="space-y-2">
          {projects.map(p => (
            <div
              key={p.id}
              className={`flex justify-between items-center border p-3 rounded-md shadow-sm cursor-pointer ${selectedProject === p.id ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-200`}
              onClick={() => setSelectedProject(p.id)}
            >
              <span className="text-gray-900 font-medium">
                {p.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent div's onClick
                  deleteProject(p.id);
                }}
                className="text-red-600 hover:text-red-700"
              >
                delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-2 p-6 overflow-y-auto bg-white">
        {selectedProject && (
          <div className="space-y-4">
            <div className="text-sm mb-1 text-gray-700">
              Progress: <span className="font-semibold text-gray-900">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-300 h-3 rounded-full">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900">Stages</h2>
            <button
              onClick={() => createStage(null)}
              className="mb-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer"
            >
              Add Root Stage
            </button>

            <button
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition ml-3 cursor-pointer"
              onClick={generateSuggestions}
            >
              AI Suggestion
            </button>

            <div className="space-y-2">
              {stages.map(renderStage)}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
