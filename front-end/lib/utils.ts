// front-end/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CurrentUser = {
  id: string;
  email?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
};

export async function getCurrentUser(
  client?: SupabaseClient
): Promise<CurrentUser | null> {
  const supabaseClient = client ?? supabase;

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError) {
    console.error("Auth error while fetching user:", authError.message);
    return null;
  }

  if (!authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching user profile:", profileError.message);
    return null;
  }

  const profileData = (profile ?? {}) as Record<string, unknown> & {
    id?: string;
    email?: string | null;
    avatar_url?: string | null;
  };

  const metadataAvatar = (
    authUser.user_metadata as { avatar_url?: string | null } | null | undefined
  )?.avatar_url;

  return {
    ...profileData,
    id: profileData.id ?? authUser.id,
    email: profileData.email ?? authUser.email ?? null,
    avatar_url: profileData.avatar_url ?? metadataAvatar ?? null,
  } satisfies CurrentUser;
}


