// routes/art.js

import express from "express";
import { dalleBuffer, uploadToCloudinaryBuffer } from "../services/imageGeneration.js";

import { supabaseForUser } from "../lib/supabase.js";

import { cdnUrl } from "../lib/image.js";



const router = express.Router();

/* ------------------------------------------------------------------ */
/* A) Generic: generate from a prompt                                  */
/* ------------------------------------------------------------------ */
/**
 * POST /art/generate-from-prompt
 * body: {
 *   prompt: string,
 *   size?: "1024x1024"|"1792x1024"|"1024x1792",
 *   negative?: string,
 *   folder_id?: uuid,
 *   kind?: string,                 // default "generated"
 *   brand_id?: uuid,
 *   dca_id?: uuid,
 *   public_id_hint?: string,
 *   alt?: string,
 *   metadata?: object
 * }
 */
router.post("/generate-from-prompt", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const {
      prompt,
      size = "1024x1024",
      negative = "",
      folder_id = null,
      kind = "generated",
      brand_id = null,
      dca_id = null,
      public_id_hint,
      alt = "",
      metadata = {},
    } = req.body || {};

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }

    // ✅ size guard for DALL·E 3
    const allowedSizes = new Set(["1024x1024", "1792x1024", "1024x1792"]);
    if (!allowedSizes.has(size)) {
      return res.status(400).json({ error: `Invalid size: ${size}` });
    }

    // ✅ kind whitelist (align with your CHECK constraint)
    const allowedKinds = new Set([
      "generated",
      "concept",
      "moodboard",
      "logo_mark",
      "brand_thumbnail",
      "dca_avatar",
    ]);
    const safeKind = allowedKinds.has(kind) ? kind : "generated";

    const sb = supabaseForUser(token);
    const { data: uData, error: uErr } = await sb.auth.getUser();
    if (uErr || !uData?.user) return res.status(401).json({ error: "Auth failed" });
    const user_id = uData.user.id;

    // Optional: verify folder ownership
    if (folder_id) {
      const { data: f } = await sb.from("folders").select("id,user_id").eq("id", folder_id).maybeSingle();
      if (!f || f.user_id !== user_id) return res.status(404).json({ error: "Folder not found" });
    }

    // 1) Generate
    const buf = await dalleBuffer({ prompt, size, negative });

    // 2) Upload (let Cloudinary pick an ID if hint is empty)
    const up = await uploadToCloudinaryBuffer({
      buffer: buf,
      publicId: public_id_hint || undefined,
    });

    // 3) Save
    const { data: saved, error: saveErr } = await sb
      .from("project_images")
      .insert({
        user_id,
        folder_id,
        brand_id,
        dca_id,
        kind: safeKind,
        public_id: up.public_id,
        format: up.format,
        version: up.version,
        width: up.width,
        height: up.height,
        bytes: up.bytes,
        alt: alt || prompt.slice(0, 140),
        metadata: { ...metadata, prompt, negative, size },
      })
      .select("id, kind, public_id")
      .single();
    if (saveErr) return res.status(500).json({ error: saveErr.message, where: "save image" });

    return res.status(200).json({
      id: saved.id,
      kind: saved.kind,
      public_id: saved.public_id,
      url: cdnUrl(saved.public_id),
    });
  } catch (e) {
    console.error("generate-from-prompt error:", e?.response?.data || e?.message || e);
    return res.status(500).json({ error: "Image generation failed" });
  }
});
export default router;
