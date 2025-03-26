"use client"

import { useState } from "react"
import { Login } from "./Login"
import { Signup } from "./Signup"
import { ForgotPassword } from "./ForgotPassword"
import { Users } from "lucide-react"

export function Auth() {
  const [view, setView] = useState<"login" | "signup" | "forgot-password">("login")

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Users className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="mt-3 text-center text-3xl font-extrabold text-gray-900">Team Allocation</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {view === "login" && <Login onToggleView={setView} />}
          {view === "signup" && <Signup onToggleView={setView} />}
          {view === "forgot-password" && <ForgotPassword onToggleView={setView} />}
        </div>
      </div>
    </div>
  )
}

