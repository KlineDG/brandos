// lib/supabase.js

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Create a Supabase client for a user request.
 * @param {string} accessToken - JWT from headers
 */
export function supabaseForUser(accessToken) {
  if (!accessToken) throw new Error("Missing access token");
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/**
 * Create a service client (full privileges with SERVICE_ROLE_KEY).
 * Use only for backend jobs, never expose to frontend.
 */
export function supabaseService() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
