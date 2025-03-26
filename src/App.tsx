"use client"

import { useState } from "react"
import { Users, Plus, X } from "lucide-react"
import { Timeline } from "./components/Timeline"
import { useStore } from "./store"
import { v4 as uuidv4 } from "uuid"

function App() {
  const { teamMembers, projects, addTeamMember, addProject } = useStore()
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [newMember, setNewMember] = useState({ name: "", role: "" })
  const [newProject, setNewProject] = useState({ name: "", color: "#3b82f6" })

  const handleAddMember = () => {
    if (newMember.name && newMember.role) {
      addTeamMember({
        id: uuidv4(),
        name: newMember.name,
        role: newMember.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMember.name)}&background=random`,
      })
      setNewMember({ name: "", role: "" })
      setShowAddMember(false)
    }
  }

  const handleAddProject = () => {
    if (newProject.name && newProject.color) {
      addProject({
        name: newProject.name,
        color: newProject.color,
      })
      setNewProject({ name: "", color: "#3b82f6" })
      setShowAddProject(false)
    }
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Team Members</h2>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
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
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button
                  onClick={handleAddMember}
                  className="w-full mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            )}

            <ul className="space-y-2">
              {teamMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.role}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Projects</h2>
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
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
                    />
                    <span className="text-sm">{newProject.color}</span>
                  </div>
                </div>
                <button
                  onClick={handleAddProject}
                  className="w-full mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  Add Project
                </button>
              </div>
            )}

            <ul className="space-y-2">
              {projects.map((project) => (
                <li key={project.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }}></div>
                  <div className="font-medium">{project.name}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Timeline />
        </div>
      </main>
    </div>
  )
}

export default App

