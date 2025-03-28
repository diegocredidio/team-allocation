export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          role: string
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          role?: string
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      allocations: {
        Row: {
          id: string
          user_id: string
          team_member_id: string
          project_id: string
          start_date: string
          end_date: string
          percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_member_id: string
          project_id: string
          start_date: string
          end_date: string
          percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_member_id?: string
          project_id?: string
          start_date?: string
          end_date?: string
          percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

