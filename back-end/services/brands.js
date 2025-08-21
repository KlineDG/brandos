// services/brands.js

import { FinalZ } from "../schemas/brand.js";

/**
 * Parse & validate AI response
 */
export function validateFinalJSON(json) {
  const parsed = FinalZ.safeParse(json);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.format()));
  }
  return parsed.data;
}

/**
 * Upsert folder for user/session
 */
export async function ensureFolder(sb, user_id, session_id) {
  const { data, error } = await sb
    .from("folders")
    .upsert({ user_id, session_id, metadata: {} }, { onConflict: "session_id" })
    .select("id, brand_id, dca_id")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Insert Brand row
 */
export async function createBrand(sb, user_id, brand) {
  const { data, error } = await sb
    .from("brands")
    .insert({ user_id, ...brand })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Insert Dream Customer row
 */
export async function createDca(sb, user_id, brand_id, dca) {
  const { data, error } = await sb
    .from("dream_customers")
    .insert({ user_id, brand_id, ...dca })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update folder with brand + dca
 */
export async function linkFolder(sb, folder_id, brand_id, dca_id) {
  const { error } = await sb
    .from("folders")
    .update({ brand_id, dca_id })
    .eq("id", folder_id);
  if (error) throw error;
}
