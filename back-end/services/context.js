// services/context.js

import { buildContextForSession } from "../lib/context.js";
import { getChatJSON } from "../lib/openai.js";

export async function generateFinalJSON(sb, session_id, systemPrompt) {
  const userMsgs = await buildContextForSession(sb, session_id);
  const messages = [systemPrompt, ...userMsgs];
  const raw = await getChatJSON(messages);
  return JSON.parse(raw);
}
