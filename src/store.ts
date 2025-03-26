import { create } from "zustand"
import type { TeamMember, Allocation, Project } from "./types"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "./lib/supabase"

interface Store {
  teamMembers: TeamMember[]
  allocations: Allocation[]
  projects: Project[]
  loading: boolean
  initialized: boolean
  fetchUserData: (userId: string) => Promise<void>
  addTeamMember: (member: Omit<TeamMember, "id">) => Promise<void>
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>
  removeTeamMember: (id: string) => Promise<void>
  addProject: (project: Omit<Project, "id">) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  removeProject: (id: string) => Promise<void>
  addAllocation: (allocation: Omit<Allocation, "id">) => Promise<void>
  updateAllocation: (id: string, updates: Partial<Allocation>) => Promise<void>
  removeAllocation: (id: string) => Promise<void>
}

export const useStore = create<Store>((set, get) => ({
  teamMembers: [],
  allocations: [],
  projects: [],
  loading: false,
  initialized: false,

  fetchUserData: async (userId: string) => {
    set({ loading: true })

    try {
      // Fetch team members
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", userId)

      if (teamMembersError) throw teamMembersError

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase.from("projects").select("*").eq("user_id", userId)

      if (projectsError) throw projectsError

      // Fetch allocations
      const { data: allocations, error: allocationsError } = await supabase
        .from("allocations")
        .select("*")
        .eq("user_id", userId)

      if (allocationsError) throw allocationsError

      // Transform data to match our types
      const transformedTeamMembers = teamMembers.map((member: any) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
      }))

      const transformedProjects = projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        color: project.color,
      }))

      const transformedAllocations = allocations.map((allocation: any) => ({
        id: allocation.id,
        teamMemberId: allocation.team_member_id,
        projectId: allocation.project_id,
        startDate: allocation.start_date,
        endDate: allocation.end_date,
        percentage: allocation.percentage,
      }))

      set({
        teamMembers: transformedTeamMembers,
        projects: transformedProjects,
        allocations: transformedAllocations,
        initialized: true,
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      set({ loading: false })
    }
  },

  addTeamMember: async (member) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const newMemberId = uuidv4()

      // Insert into Supabase
      const { error } = await supabase.from("team_members").insert({
        id: newMemberId,
        user_id: user.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
      })

      if (error) throw error

      // Add to local state after successful DB insert
      const newMember = {
        id: newMemberId,
        ...member,
      }

      set((state) => ({
        teamMembers: [...state.teamMembers, newMember],
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error adding team member:", error)
      return Promise.reject(error)
    }
  },

  updateTeamMember: async (id, updates) => {
    try {
      // Update in Supabase
      const { error } = await supabase.from("team_members").update(updates).eq("id", id)

      if (error) throw error

      // Update local state
      set((state) => ({
        teamMembers: state.teamMembers.map((member) => (member.id === id ? { ...member, ...updates } : member)),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating team member:", error)
      return Promise.reject(error)
    }
  },

  removeTeamMember: async (id) => {
    try {
      // Delete from Supabase
      const { error } = await supabase.from("team_members").delete().eq("id", id)

      if (error) throw error

      // Remove from local state
      set((state) => ({
        teamMembers: state.teamMembers.filter((member) => member.id !== id),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error removing team member:", error)
      return Promise.reject(error)
    }
  },

  addProject: async (project) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const newProjectId = uuidv4()

      // Insert into Supabase
      const { error } = await supabase.from("projects").insert({
        id: newProjectId,
        user_id: user.id,
        name: project.name,
        color: project.color,
      })

      if (error) throw error

      // Add to local state after successful DB insert
      const newProject = {
        id: newProjectId,
        ...project,
      }

      set((state) => ({
        projects: [...state.projects, newProject],
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error adding project:", error)
      return Promise.reject(error)
    }
  },

  updateProject: async (id, updates) => {
    try {
      // Update in Supabase
      const { error } = await supabase.from("projects").update(updates).eq("id", id)

      if (error) throw error

      // Update local state
      set((state) => ({
        projects: state.projects.map((project) => (project.id === id ? { ...project, ...updates } : project)),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating project:", error)
      return Promise.reject(error)
    }
  },

  removeProject: async (id) => {
    try {
      // Delete from Supabase
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) throw error

      // Remove from local state
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error removing project:", error)
      return Promise.reject(error)
    }
  },

  addAllocation: async (allocation) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const newAllocationId = uuidv4()

      // Insert into Supabase
      const { error } = await supabase.from("allocations").insert({
        id: newAllocationId,
        user_id: user.id,
        team_member_id: allocation.teamMemberId,
        project_id: allocation.projectId,
        start_date: allocation.startDate,
        end_date: allocation.endDate,
        percentage: allocation.percentage,
      })

      if (error) throw error

      // Add to local state after successful DB insert
      const newAllocation = {
        id: newAllocationId,
        ...allocation,
      }

      set((state) => ({
        allocations: [...state.allocations, newAllocation],
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error adding allocation:", error)
      return Promise.reject(error)
    }
  },

  updateAllocation: async (id, updates) => {
    try {
      // First update local state for immediate UI feedback
      set((state) => ({
        allocations: state.allocations.map((allocation) =>
          allocation.id === id ? { ...allocation, ...updates } : allocation,
        ),
      }))

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Convert from camelCase to snake_case for the database
      const dbUpdates: any = {}
      if (updates.teamMemberId) dbUpdates.team_member_id = updates.teamMemberId
      if (updates.projectId) dbUpdates.project_id = updates.projectId
      if (updates.startDate) dbUpdates.start_date = updates.startDate
      if (updates.endDate) dbUpdates.end_date = updates.endDate
      if (updates.percentage !== undefined) dbUpdates.percentage = updates.percentage

      // Add updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString()

      console.log("Updating allocation in Supabase:", id, dbUpdates)

      // Update in Supabase
      const { error } = await supabase.from("allocations").update(dbUpdates).eq("id", id).eq("user_id", user.id)

      if (error) {
        console.error("Supabase update error:", error)
        throw error
      }

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating allocation:", error)

      // Revert optimistic update on error
      await get().fetchUserData((await supabase.auth.getUser()).data.user?.id || "")

      return Promise.reject(error)
    }
  },

  removeAllocation: async (id) => {
    try {
      // Delete from Supabase
      const { error } = await supabase.from("allocations").delete().eq("id", id)

      if (error) throw error

      // Remove from local state
      set((state) => ({
        allocations: state.allocations.filter((allocation) => allocation.id !== id),
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error removing allocation:", error)
      return Promise.reject(error)
    }
  },
}))

