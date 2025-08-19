// routes/folders.js
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: uData, error: uErr } = await sb.auth.getUser();
    if (uErr || !uData?.user) return res.status(401).json({ error: "Auth failed" });

    const user_id = uData.user.id;
    const { name, custom_name, metadata, session_id } = req.body;

    const { data, error } = await sb
      .from("folders")
      .insert({
        user_id,
        name,
        custom_name: custom_name ?? null,
        metadata: metadata ?? {},
        session_id: session_id ?? null,
        
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error (folders):", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ folder_id: data.id });
  } catch (e) {
    console.error("folders/create error:", e);
    return res.status(500).json({ error: "Failed to create folder" });
  }
});

export default router;