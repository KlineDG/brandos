// lib/context.js

/**
 * Build conversation context from Supabase for a given session.
 * Returns system + user messages ready for OpenAI.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {string} session_id
 * @param {object} [options]
 * @param {number} [options.limit=15] - how many recent messages to include
 * @param {string} [options.messageColumn="content"] - column name in messages table
 * @returns {Promise<Array<{ role: string, content: string }>>}
 */
export async function buildContextForSession(
  sb,
  session_id,
  { limit = 15, messageColumn = "content" } = {}
) {
  // Fetch memory chunks (summaries)
  const { data: chunks, error: chunksErr } = await sb
    .from("memory_chunks")
    .select("summary, created_at")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  if (chunksErr) throw new Error("Failed to fetch memory_chunks: " + chunksErr.message);

  const longTermSummary = (chunks ?? [])
    .map((c) => (c.summary || "").trim())
    .filter(Boolean)
    .join("\n\n");

  // Fetch recent raw messages
  const { data: msgs, error: msgErr } = await sb
    .from("messages")
    .select(`role, ${messageColumn}, created_at`)
    .eq("session_id", session_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (msgErr) throw new Error("Failed to fetch messages: " + msgErr.message);

  const recent = (msgs ?? []).reverse(); // oldest → newest

  // Create user-facing recap
  const userBlob = [
    longTermSummary ? `== CONVERSATION RECAP ==\n${longTermSummary}` : null,
    "== RECENT TURNS ==",
    ...recent.map((m) => `[${m.role}] ${m[messageColumn] ?? ""}`),
  ]
    .filter(Boolean)
    .join("\n");

  return [{ role: "user", content: userBlob }];
}
