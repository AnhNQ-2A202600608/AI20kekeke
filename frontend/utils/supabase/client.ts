import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_DEV;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_PROD ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV;

let browserClient: SupabaseClient | null = null;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase browser auth is not configured.");
  }

  browserClient ??= createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
};
