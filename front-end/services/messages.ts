// services/messages.ts
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase";

export async function toggleStar(messageId: string, is_starred: boolean) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  type Resp = { id: string; is_starred: boolean };
  return api.post<Resp>(`/messages/${messageId}/star`, { is_starred }, token);
}

export async function fetchMessages(folderId: string, before?: string, limit = 50) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({ folder_id: folderId, limit: limit.toString() });
  if (before) params.append("before", before);

  type Resp = { messages: any[]; next_cursor?: string };
  return api.get<Resp>(`/messages?${params.toString()}`, token);
}
