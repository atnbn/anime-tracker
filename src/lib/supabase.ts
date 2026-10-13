import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
// An inert local fallback lets the entry point show setup instructions instead of crashing at import time.
export const supabase = createClient<Database>(supabaseUrl || "http://127.0.0.1:54321", supabaseKey || "setup-required");
