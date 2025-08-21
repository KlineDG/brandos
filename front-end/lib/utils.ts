// front-end/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/lib/supabase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export async function getCurrentUser() {
  // Step 1: Get the authenticated user from Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error or no user found:", authError?.message);
    return null;
  }
  // Step 2: Use the email from auth to fetch full user record from your 'users' table
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", user.email)
    .maybeSingle(); // ✅ Avoids errors when no rows found

  if (error) {
    console.error("Error fetching user details:", error.message);
    return null;
  }

  return data; // Full user record or null
}


