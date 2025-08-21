import { getAccessToken } from "@/lib/supabase";
import { api } from "@/lib/api";

export async function finalizeBrand(sessionId: string, folderName?: string | null) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not logged in");

  type Resp = {
    folder_id?: string;
    brand?: { id?: string };
    dca?: { id?: string };
  };

  const r = await api.post<Resp>("/brand/finalize", { session_id: sessionId, folder_name: folderName ?? null }, token);
  return r;
}
