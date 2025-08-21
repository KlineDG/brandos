import { api } from "@/lib/api";

export async function fetchCombinedSummary(sessionId: string, token: string) {
  type Resp = { summary?: string };
  const r = await api.get<Resp>(`/memory/summary?session_id=${encodeURIComponent(sessionId)}`, token);
  return r.summary ?? "";
}

export type APIMessage = { role: "user" | "assistant" | "system"; content: string };

export async function saveMessages(sessionId: string, messages: APIMessage[], token: string) {
  await api.post("/memory/messages/save", { session_id: sessionId, messages }, token);
}

export async function summarize(messages: APIMessage[], token?: string) {
  type Resp = { summary: string };
  const r = await api.post<Resp>("/chat/summarize", { messages }, token);
  return r.summary;
}

export async function saveChunk(sessionId: string, messages: APIMessage[], summary: string, token: string) {
  // If your real endpoint name differs, adjust here:
  await api.post("/memory/chunks/save", { session_id: sessionId, messages, summary }, token);
}
