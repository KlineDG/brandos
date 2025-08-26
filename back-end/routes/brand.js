// routes/brand.js

import express from "express";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';
import { generateForFolder } from "../services/art.js";
import openai from "../lib/openai.js";
import { PlatformItem, BrandZ, DcaZ, FinalZ } from "../schemas/brand.js";

const router = express.Router();

/* ==============
   Config helpers
   ============== */
const MESSAGE_TEXT_COLUMN = "content"; // ← change to "content" if that's your column

function supabaseForUser(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}



/* =========================
   Context & OpenAI helpers
   ========================= */
async function buildContextForSession(sb, session_id) {
  // Summaries (long-term)
  const { data: chunks, error: chunksErr } = await sb
    .from("memory_chunks")
    .select("summary, created_at")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });
  if (chunksErr) throw chunksErr;

  const longTermSummary = (chunks ?? [])
    .map((c) => (c.summary || "").trim())
    .filter(Boolean)
    .join("\n\n");

  // Recent raw turns
  const { data: msgs, error: msgErr } = await sb
    .from("messages")
    .select(`role, ${MESSAGE_TEXT_COLUMN}, created_at`)
    .eq("session_id", session_id)
    .order("created_at", { ascending: false })
    .limit(15);
  if (msgErr) throw msgErr;

  const recent = (msgs ?? []).reverse(); // oldest → newest

  const system = {
    role: "system",
    content: BRAND_FINALIZE_PROMPT,
  };

  const userBlob = [
    longTermSummary ? `== CONVERSATION RECAP ==\n${longTermSummary}` : null,
    "== RECENT TURNS ==",
    ...recent.map((m) => `[${m.role}] ${m[MESSAGE_TEXT_COLUMN] ?? ""}`),
  ].filter(Boolean).join("\n");

  return [system, { role: "user", content: userBlob }];
}

async function callOpenAIJSON(messages) {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0,
    messages,
  });
  return resp.choices?.[0]?.message?.content || "{}";
}

/* =========================
   POST /brand/generate
   ========================= */
router.post("/generate", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { session_id } = req.body;
    if (!token) return res.status(401).json({ error: "No token" });
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const sb = supabaseForUser(token);
    const msgs = await buildContextForSession(sb, session_id);
    const raw = await callOpenAIJSON(msgs);

    let json;
    try { json = JSON.parse(raw); }
    catch { return res.status(500).json({ error: "Model did not return valid JSON", raw }); }

    const parsed = FinalZ.safeParse(json);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", issues: parsed.error.format(), raw });
    }
    return res.status(200).json(parsed.data); // { brand, dca }
  } catch (e) {
    console.error("brand/generate error:", e);
    return res.status(500).json({ error: "Generation failed" });
  }
});

/* =========================
   POST /brand/finalize
   ========================= */

    router.post("/finalize", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const { session_id } = req.body;
    if (!token) return res.status(401).json({ error: "No token" });
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const sb = supabaseForUser(token);

    // Auth user (RLS)
    const { data: uData, error: uErr } = await sb.auth.getUser();
    if (uErr || !uData?.user) return res.status(401).json({ error: "Auth failed" });
    const user_id = uData.user.id;

    // Idempotent: existing folder?
    const { data: foundFolder, error: fFindErr } = await sb
      .from("folders")
      .select("id, brand_id, dca_id")
      .eq("user_id", user_id)
      .eq("session_id", session_id)
      .maybeSingle();
    if (fFindErr) console.warn("folders find error:", fFindErr?.message);

    let folder = foundFolder || null;

    // If already finalized, return it
    if (folder?.brand_id && folder?.dca_id) {
      const [{ data: brand }, { data: dca }] = await Promise.all([
        sb.from("brands").select("*").eq("id", folder.brand_id).maybeSingle(),
        sb.from("dream_customers").select("*").eq("id", folder.dca_id).maybeSingle(),
      ]);
      return res.status(200).json({ folder_id: folder.id, brand, dca });
    }

    // Build → Generate JSON
    const messagesForModel = await buildContextForSession(sb, session_id);
    const raw = await callOpenAIJSON(messagesForModel);

    let json;
    try { json = JSON.parse(raw); }
    catch { return res.status(500).json({ error: "Model did not return valid JSON", raw }); }

    const parsed = FinalZ.safeParse(json);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", issues: parsed.error.format(), raw });
    }
    const { brand, dca } = parsed.data;

    // Create/reuse folder (idempotent; do NOT set `name`)
    if (!folder) {
      const { data: up, error: upErr } = await sb
        .from("folders")
        .upsert(
          { user_id, session_id, metadata: {} },
          { onConflict: "session_id" }
        )
        .select("id, brand_id, dca_id")
        .single();
      if (upErr) return res.status(500).json({ error: upErr.message, where: "insert/upsert folder" });
      folder = up;
    }

    // after you have: user_id, session_id, and folder.id
    const { error: bfErr } = await sb.rpc('backfill_folder', {
  p_user: user_id,
  p_session: session_id,
  p_folder: folder.id,
});
if (bfErr) return res.status(500).json({ error: bfErr.message, where: 'rpc backfill_folder' });




    // Insert Brand
    const { data: brandRow, error: bErr } = await sb
      .from("brands")
      .insert({
        user_id,
        name: brand.name,
        description: brand.description,
        product_type: brand.product_type,
        features: brand.features ?? [],
        benefits: brand.benefits ?? [],
        differentiation: brand.differentiation,
        tone_of_voice: brand.tone_of_voice ?? null,
        mission: brand.mission ?? null,
        vision: brand.vision ?? null,
        values: brand.values ?? [],
        competitors: brand.competitors ?? [],
        target_audience: brand.target_audience ?? "",
        target_platforms: brand.target_platforms ?? [],
        stage: brand.stage ?? "idea",
        system_prompt: brand.system_prompt ?? "",
        onboarding_summary: brand.onboarding_summary ?? "",
        metadata: brand.metadata ?? {},
      })
      .select("*")
      .single();
    if (bErr) return res.status(500).json({ error: bErr.message, where: "insert brand" });

    // Insert DCA (table name is dream_customers)
    const { data: dcaRow, error: dErr } = await sb
      .from("dream_customers")
      .insert({
        user_id,
        brand_id: brandRow.id,
        name: dca.name,
        demographics: dca.demographics ?? {},
        career: dca.career ?? {},
        psychographics: dca.psychographics ?? {},
        digital_behavior: dca.digital_behavior ?? {},
        buying_behavior: dca.buying_behavior ?? {},
        pain_points: dca.pain_points ?? [],
        backstory: dca.backstory ?? "",
        system_prompt: dca.system_prompt ?? "",
        metadata: dca.metadata ?? {},
      })
      .select("*")
      .single();
    if (dErr) return res.status(500).json({ error: dErr.message, where: "insert dca" });

    // Link folder
    const { error: fErr } = await sb
      .from("folders")
      .update({ brand_id: brandRow.id, dca_id: dcaRow.id })
      .eq("id", folder.id);
    if (fErr) return res.status(500).json({ error: fErr.message, where: "update folder links" });

    // Kick off brand thumbnail + DCA avatar generation
try {
  const folder_id = folder.id;
  await generateForFolder({ sb, user_id, folder_id });
} catch (e) {
  console.warn("art/generate-for-folder failed:", e?.message || e);
}

    return res.status(200).json({ folder_id: folder.id, brand: brandRow, dca: dcaRow });
  } catch (e) {
    console.error("brand/finalize error:", e);
    return res.status(500).json({ error: "Finalize failed" });
  }
});


export default router;
