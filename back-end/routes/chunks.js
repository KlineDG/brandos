// routes/chunks.js

import express from "express";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Init OpenAI and Supabase clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.use(express.json());

// POST /memory-chunk
router.post("/save", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: uData, error: uErr } = await sb.auth.getUser();
    if (uErr || !uData?.user) return res.status(401).json({ error: "Auth failed" });
    const user_id = uData.user.id;

    const {
      folder_id,
      session_id,
      messages,
      summary,
      context_type = "general_chat",
    } = req.body;

    if (!session_id || !Array.isArray(messages) || messages.length === 0 || !summary) {
      return res.status(400).json({ error: "Missing session_id, messages, or summary." });
    }

    // (optional) normalize on server too
    const normalized = messages.map(m => ({
      role: m.role,
      content: m.content ?? m.text ?? "",
    }));

    const { data, error } = await sb
      .from("memory_chunks")
      .insert({
        user_id,           
        folder_id,         
        session_id,
        summary,
        messages: normalized, // JSONB
        context_type,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error (memory_chunks):", error);
      return res.status(500).json({ error: error.message, code: error.code, details: error.details, hint: error.hint });
    }

    return res.status(200).json({ chunk: data });
  } catch (err) {
    console.error("Memory chunk route error:", err);
    return res.status(500).json({ error: "Failed to store memory chunk." });
  }
});

// Express route at /messages/save

function toPlainText(input) {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (Array.isArray(input)) return input.map(toPlainText).join(" ");
  if (typeof input === "object" && input.text) return toPlainText(input.text);
  return JSON.stringify(input);
}

router.post("/messages/save", async (req, res) => {
  try {
    // Auth via user’s JWT (required for RLS)
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: uData, error: uErr } = await sb.auth.getUser();
    if (uErr || !uData?.user) return res.status(401).json({ error: "Auth failed" });
    const user_id = uData.user.id;

    // Validate input
    const { messages, session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages" });
    }

    // Normalize and filter empties
    const rows = messages
      .map(m => ({
        user_id,                  
        session_id,               
        folder_id: null,          
        role: m.role === "assistant" ? "assistant" : "user",
        content: toPlainText(m.content ?? m.text),
        is_archived: false,
        is_summarized: false,     
        // Optional: client-generated id/timestamp for idempotency
        // client_msg_id: m.id ?? null,
        // created_at: new Date().toISOString(),
      }))
      .filter(r => r.content.trim().length > 0);

    if (rows.length === 0) {
      return res.status(400).json({ error: "All messages were empty" });
    }

    // Insert
    const { data, error } = await sb
      .from("messages")
      .insert(rows)
      .select("id, role, created_at");

    if (error) {
      console.error("Supabase insert error (messages):", error);
      return res.status(500).json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    return res.status(200).json({ success: true, inserted: data || [] });
  } catch (err) {
    console.error("Unexpected backend error (messages/save):", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});


router.get("/summary", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // accept both session_id and sessionId
    const session_id = req.query.session_id || req.query.sessionId;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const { data, error } = await sb
      .from("memory_chunks")
      .select("summary, created_at")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const combined =
      (data ?? [])
        .map(r => (r.summary || "").trim())
        .filter(Boolean)
        .join("\n\n");

    // Always succeed, even if no chunks yet
    return res.status(200).json({ summary: combined || "" });
  } catch (e) {
    console.error("summary route error:", e);
    return res.status(500).json({ error: "Failed to fetch summary" });
  }
});


export default router; // chunkRouter