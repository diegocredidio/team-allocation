"use client"

import { useState, useEffect } from "react"
import { Users, Plus, X, LogOut } from "lucide-react"
import { Timeline } from "./Timeline"
import { useStore } from "../store"
import { useAuth } from "../context/AuthContext"
import { Auth } from "./auth/Auth"

export function AppContent() {
  const { user, signOut } = useAuth()
  const { teamMembers, projects, addTeamMember, addProject, fetchUserData, loading, initialized } = useStore()

  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [newMember, setNewMember] = useState({ name: "", role: "" })
  const [newProject, setNewProject] = useState({ name: "", color: "#3b82f6" })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch user data when authenticated
  useEffect(() => {
    if (user && !initialized && !loading) {
      fetchUserData(user.id)
    }
  }, [user, initialized, loading, fetchUserData])

  const handleAddMember = async () => {
    if (newMember.name && newMember.role) {
      setIsSubmitting(true)
      setError(null)

      try {
        await addTeamMember({
          name: newMember.name,
          role: newMember.role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMember.name)}&background=random`,
        })

        setNewMember({ name: "", role: "" })
        setShowAddMember(false)
      } catch (err) {
        setError("Failed to add team member. Please try again.")
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleAddProject = async () => {
    if (newProject.name && newProject.color) {
      setIsSubmitting(true)
      setError(null)

      try {
        await addProject({
          name: newProject.name,
          color: newProject.color,
        })

        setNewProject({ name: "", color: "#3b82f6" })
        setShowAddProject(false)
      } catch (err) {
        setError("Failed to add project. Please try again.")
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Team Allocation</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[300px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Team Members</h2>
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                    disabled={isSubmitting}
                  >
                    {showAddMember ? <X size={16} /> : <Plus size={16} />}
                  </button>
                </div>

                {showAddMember && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        className="w-full p-2 border rounded"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Role</label>
                      <input
                        type="text"
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        className="w-full p-2 border rounded"
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      onClick={handleAddMember}
                      className="w-full mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={isSubmitting || !newMember.name || !newMember.role}
                    >
                      {isSubmitting ? "Adding..." : "Add Member"}
                    </button>
                  </div>
                )}

                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No team members yet. Add your first team member!</div>
                ) : (
                  <ul className="space-y-2">
                    {teamMembers.map((member) => (
                      <li key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <img
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[300px]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Projects</h2>
                  <button
                    onClick={() => setShowAddProject(!showAddProject)}
                    className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                    disabled={isSubmitting}
                  >
                    {showAddProject ? <X size={16} /> : <Plus size={16} />}
                  </button>
                </div>

                {showAddProject && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Project Name</label>
                      <input
                        type="text"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        className="w-full p-2 border rounded"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newProject.color}
                          onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                          className="p-1 border rounded h-8 w-8"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">{newProject.color}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleAddProject}
                      className="w-full mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={isSubmitting || !newProject.name}
                    >
                      {isSubmitting ? "Adding..." : "Add Project"}
                    </button>
                  </div>
                )}

                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No projects yet. Add your first project!</div>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((project) => (
                      <li key={project.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }}></div>
                        <div className="font-medium">{project.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Timeline />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

