"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  async function login() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    localStorage.setItem("token", data.token)

    router.push("/dashboard")
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h1>

        <input
          className="border border-gray-300 p-3 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border border-gray-300 p-3 w-full mb-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-3 w-full rounded hover:bg-blue-700 transition"
          onClick={login}
        >
          Login
        </button>

        <div className="mt-6 text-center text-sm text-gray-700">
          Don’t have an account?
          <button
            className="text-blue-600 ml-1 hover:underline"
            onClick={() => router.push("/register")}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  )
}