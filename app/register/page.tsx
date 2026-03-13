"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Register() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function register() {

    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    if (!res.ok) {
      const text = await res.text()
      setError(text)
      return
    }

    router.push("/login")
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create an Account</h1>

        <input
          aria-label="Email"
          type="email"
          className="border border-gray-300 p-3 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          aria-label="Password"
          type="password"
          className="border border-gray-300 p-3 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="text-red-600 mb-4">
            {error}
          </div>
        )}

        <button
          className="bg-blue-600 text-white px-4 py-3 w-full rounded hover:bg-blue-700 transition"
          onClick={register}
        >
          Register
        </button>

        <div className="mt-6 text-center text-sm text-gray-700">
          Already have an account?
          <button
            className="text-blue-600 ml-1 hover:underline"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}