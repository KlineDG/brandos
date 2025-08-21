import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { fetchCombinedSummary, saveMessages, summarize, saveChunk, APIMessage } from "./memory";
import { SUMMARY_THRESHOLD } from "@/constants/chat";

export type UIMessage = { role: "user" | "assistant" | "system"; text: string };

export async function sendReceiveAndPersist(opts: {
  systemPrompt: string;
  sessionId: string;
  currentMessages: UIMessage[];   // what you show in UI
  userText: string;               // latest input
  token?: string | null;          // optional; fetched if missing
  summaryThreshold?: number;      // override default
}) {
  const {
    systemPrompt,
    sessionId,
    currentMessages,
    userText,
    summaryThreshold = SUMMARY_THRESHOLD,
  } = opts;

  const token = opts.token ?? (await getAccessToken());
  if (!token) throw new Error("Not authenticated");

  // (1) Optional recap
  const recap = await fetchCombinedSummary(sessionId, token);

  // (2) Build outbound payload
  const userMsg: UIMessage = { role: "user", text: userText };
  const uiMessages = [...currentMessages, userMsg];

  const outbound: APIMessage[] = [
    { role: "system", content: systemPrompt },
    ...(recap ? [{ role: "assistant", content: `Conversation recap:\n${recap}` } as APIMessage] : []),
    ...uiMessages.map(m => ({ role: m.role, content: m.text } as APIMessage)),
  ];

  // (3) Call chat endpoint
  type ChatResp = { text: string };
  const res = await api.post<ChatResp>("/chat/text", { messages: outbound });

  const assistant: UIMessage = { role: "assistant", text: res.text };
  const updatedUI = [...uiMessages, assistant];

  // (4) Persist just the two newest messages to memory
  await saveMessages(
    sessionId,
    [
      { role: "user", content: userText },
      { role: "assistant", content: assistant.text },
    ],
    token
  );

  // (5) Summarize older messages if threshold reached
  if (updatedUI.length >= summaryThreshold) {
    const older = updatedUI.slice(0, -2).map(m => ({ role: m.role, content: m.text } as APIMessage));
    const summary = await summarize(older);
    await saveChunk(sessionId, older, summary, token);

    // Optionally keep UI light:
    return { assistantText: assistant.text, messagesForUI: updatedUI.slice(-2) };
  }

  return { assistantText: assistant.text, messagesForUI: updatedUI };
}
