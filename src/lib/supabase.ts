import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Create a single supabase client for the entire app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (process.env.NEXT_PUBLIC_SUPABASE_URL as string)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

