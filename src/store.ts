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
    const { user } = await supabase.auth.getUser()
    if (!user) return

    const newMember = {
      id: uuidv4(),
      ...member,
    }

    set((state) => ({ teamMembers: [...state.teamMembers, newMember] }))

    try {
      const { error } = await supabase.from("team_members").insert({
        id: newMember.id,
        user_id: user.id,
        name: newMember.name,
        role: newMember.role,
        avatar: newMember.avatar,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error adding team member:", error)
      // Revert optimistic update on error
      set((state) => ({
        teamMembers: state.teamMembers.filter((m) => m.id !== newMember.id),
      }))
    }
  },

  updateTeamMember: async (id, updates) => {
    set((state) => ({
      teamMembers: state.teamMembers.map((member) => (member.id === id ? { ...member, ...updates } : member)),
    }))

    try {
      const { error } = await supabase.from("team_members").update(updates).eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error updating team member:", error)
      // Revert optimistic update on error
      await get().fetchUserData((await supabase.auth.getUser()).user?.id || "")
    }
  },

  removeTeamMember: async (id) => {
    const previousState = get().teamMembers
    set((state) => ({
      teamMembers: state.teamMembers.filter((member) => member.id !== id),
    }))

    try {
      const { error } = await supabase.from("team_members").delete().eq("id", id)
      if (error) throw error
    } catch (error) {
      console.error("Error removing team member:", error)
      // Revert optimistic update on error
      set({ teamMembers: previousState })
    }
  },

  addProject: async (project) => {
    const { user } = await supabase.auth.getUser()
    if (!user) return

    const newProject = {
      id: uuidv4(),
      ...project,
    }

    set((state) => ({ projects: [...state.projects, newProject] }))

    try {
      const { error } = await supabase.from("projects").insert({
        id: newProject.id,
        user_id: user.id,
        name: newProject.name,
        color: newProject.color,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error adding project:", error)
      // Revert optimistic update on error
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== newProject.id),
      }))
    }
  },

  updateProject: async (id, updates) => {
    set((state) => ({
      projects: state.projects.map((project) => (project.id === id ? { ...project, ...updates } : project)),
    }))

    try {
      const { error } = await supabase.from("projects").update(updates).eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error updating project:", error)
      // Revert optimistic update on error
      await get().fetchUserData((await supabase.auth.getUser()).user?.id || "")
    }
  },

  removeProject: async (id) => {
    const previousState = get().projects
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }))

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)
      if (error) throw error
    } catch (error) {
      console.error("Error removing project:", error)
      // Revert optimistic update on error
      set({ projects: previousState })
    }
  },

  addAllocation: async (allocation) => {
    const { user } = await supabase.auth.getUser()
    if (!user) return

    const newAllocation = {
      id: uuidv4(),
      ...allocation,
    }

    set((state) => ({ allocations: [...state.allocations, newAllocation] }))

    try {
      const { error } = await supabase.from("allocations").insert({
        id: newAllocation.id,
        user_id: user.id,
        team_member_id: newAllocation.teamMemberId,
        project_id: newAllocation.projectId,
        start_date: newAllocation.startDate,
        end_date: newAllocation.endDate,
        percentage: newAllocation.percentage,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error adding allocation:", error)
      // Revert optimistic update on error
      set((state) => ({
        allocations: state.allocations.filter((a) => a.id !== newAllocation.id),
      }))
    }
  },

  updateAllocation: async (id, updates) => {
    set((state) => ({
      allocations: state.allocations.map((allocation) =>
        allocation.id === id ? { ...allocation, ...updates } : allocation,
      ),
    }))

    try {
      // Convert from camelCase to snake_case for the database
      const dbUpdates: any = {}
      if (updates.teamMemberId) dbUpdates.team_member_id = updates.teamMemberId
      if (updates.projectId) dbUpdates.project_id = updates.projectId
      if (updates.startDate) dbUpdates.start_date = updates.startDate
      if (updates.endDate) dbUpdates.end_date = updates.endDate
      if (updates.percentage !== undefined) dbUpdates.percentage = updates.percentage

      const { error } = await supabase.from("allocations").update(dbUpdates).eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error updating allocation:", error)
      // Revert optimistic update on error
      await get().fetchUserData((await supabase.auth.getUser()).user?.id || "")
    }
  },

  removeAllocation: async (id) => {
    const previousState = get().allocations
    set((state) => ({
      allocations: state.allocations.filter((allocation) => allocation.id !== id),
    }))

    try {
      const { error } = await supabase.from("allocations").delete().eq("id", id)
      if (error) throw error
    } catch (error) {
      console.error("Error removing allocation:", error)
      // Revert optimistic update on error
      set({ allocations: previousState })
    }
  },
}))

