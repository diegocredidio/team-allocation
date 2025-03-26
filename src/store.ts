import { create } from "zustand"
import type { TeamMember, Allocation, Project } from "./types"
import { v4 as uuidv4 } from "uuid"

interface Store {
  teamMembers: TeamMember[]
  allocations: Allocation[]
  projects: Project[]
  addTeamMember: (member: TeamMember) => void
  addProject: (project: Omit<Project, "id">) => void
  addAllocation: (allocation: Allocation) => void
  updateAllocation: (id: string, updates: Partial<Allocation>) => void
  removeAllocation: (id: string) => void
}

export const useStore = create<Store>((set) => ({
  teamMembers: [
    {
      id: "1",
      name: "John Doe",
      role: "Frontend",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    {
      id: "2",
      name: "Jane Smith",
      role: "Backend",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
  ],
  projects: [
    { id: "1", name: "Website Redesign", color: "#2563eb" },
    { id: "2", name: "Mobile App", color: "#16a34a" },
  ],
  allocations: [
    {
      id: "1",
      teamMemberId: "1",
      projectId: "1",
      startDate: "2024-03-18",
      endDate: "2024-03-22",
      percentage: 100,
    },
    {
      id: "2",
      teamMemberId: "2",
      projectId: "2",
      startDate: "2024-03-19",
      endDate: "2024-03-23",
      percentage: 100,
    },
  ],
  addTeamMember: (member) => set((state) => ({ teamMembers: [...state.teamMembers, member] })),
  addProject: (project) => set((state) => ({ projects: [...state.projects, { ...project, id: uuidv4() }] })),
  addAllocation: (allocation) => set((state) => ({ allocations: [...state.allocations, allocation] })),
  updateAllocation: (id, updates) =>
    set((state) => ({
      allocations: state.allocations.map((allocation) =>
        allocation.id === id ? { ...allocation, ...updates } : allocation,
      ),
    })),
  removeAllocation: (id) =>
    set((state) => ({
      allocations: state.allocations.filter((allocation) => allocation.id !== id),
    })),
}))

