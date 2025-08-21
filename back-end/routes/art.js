// routes/art.js

import express from "express";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Setup helpers                                                      */
/* ------------------------------------------------------------------ */
function sbForUser(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

function cdnUrl(publicId) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${publicId}`;
}

function sizeForAR(ar) {
  const s = (ar || "").trim();
  if (s === "16:9") return "1792x1024";
  if (s === "9:16") return "1024x1792";
  return "1024x1024"; // 1:1 default
}

// 1) DALL·E 3: always return a Buffer
export async function dalleBuffer({ openai, prompt, size = "1024x1024", negative = "" }) {
  const fullPrompt = negative ? `${prompt}\n\nAvoid: ${negative}` : prompt;
  const resp = await openai.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    size, // "1024x1024" | "1792x1024" | "1024x1792"
    response_format: "b64_json",
  });
  const b64 = resp?.data?.[0]?.b64_json || "";
  const buf = Buffer.from(b64, "base64");
  if (!Buffer.isBuffer(buf)) throw new Error("dalleBuffer: result is not a Buffer");
  return buf;
}

// 2) Cloudinary upload: require a Buffer
// services/artGeneration.js (or wherever your helper lives)
export async function uploadToCloudinaryBuffer({ cloudinary, buffer, publicId, folder = "brandos" }) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(`uploadToCloudinaryBuffer: expected Buffer, got ${Object.prototype.toString.call(buffer)}`);
  }

  const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;

  // simple retry with backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(dataUri, {
        public_id: publicId,
        folder,
        resource_type: "image",
        timeout: 60000, // 60s
      });
      return res;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 750 * attempt));
    }
  }
}

/* ------------------------------------------------------------------ */
/* GPT prompt crafting for folder (Brand + DCA → image prompts)       */
/* ------------------------------------------------------------------ */
export async function getImagePromptsForFolder(openai, brand, dca) {
  const system = `Return JSON ONLY:
{"brand_thumbnail":{"prompt":string,"negative":string,"aspect_ratio":"16:9"|"1:1"|"9:16"},
 "dca_avatar":{"prompt":string,"negative":string,"aspect_ratio":"1:1"}}
Concise (1–3 sentences). No logos/text.`;
  const user = `BRAND:\n${JSON.stringify({
    name: brand.name,
    product_type: brand.product_type,
    description: brand.description,
    differentiation: brand.differentiation,
    tone_of_voice: brand.tone_of_voice || "",
    values: brand.values || [],
    stage: brand.stage || "idea",
  }, null, 2)}
DCA:\n${JSON.stringify({
    name: dca.name,
    demographics: dca.demographics || {},
    psychographics: dca.psychographics || {},
    digital_behavior: dca.digital_behavior || {},
    buying_behavior: dca.buying_behavior || {},
    pain_points: dca.pain_points || [],
    backstory: dca.backstory || "",
  }, null, 2)}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o", // or "gpt-4o-mini"
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  });

  const j = JSON.parse(resp.choices?.[0]?.message?.content || "{}");
  return {
    brandPrompt:   j?.brand_thumbnail?.prompt   || `Modern, clean brand thumbnail for "${brand.name}". No text.`,
    brandNegative: j?.brand_thumbnail?.negative || "text, watermark, artifacts, blur",
    brandSize:     sizeForAR(j?.brand_thumbnail?.aspect_ratio || "16:9"),
    dcaPrompt:     j?.dca_avatar?.prompt       || `Professional avatar representing "${dca.name}". Neutral background.`,
    dcaNegative:   j?.dca_avatar?.negative     || "text, watermark, artifacts, extra fingers",
    dcaSize:       sizeForAR(j?.dca_avatar?.aspect_ratio || "1:1"),
  };
}
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

    const sb = sbForUser(token);
    const { data: uData, error: uErr } = await sb.auth.getUser();
    if (uErr || !uData?.user) return res.status(401).json({ error: "Auth failed" });
    const user_id = uData.user.id;

    // Optional: verify folder ownership
    if (folder_id) {
      const { data: f } = await sb.from("folders").select("id,user_id").eq("id", folder_id).maybeSingle();
      if (!f || f.user_id !== user_id) return res.status(404).json({ error: "Folder not found" });
    }

    // 1) Generate
    const buf = await dalleBuffer({ openai, prompt, size, negative });

    // 2) Upload (let Cloudinary pick an ID if hint is empty)
    const up = await uploadToCloudinaryBuffer({
      cloudinary,
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


/* ------------------------------------------------------------------ */
/* B) Brand/DCA specific for a folder                                  */
/* ------------------------------------------------------------------ */
/**
 * POST /art/generate-for-folder
 * body: { folder_id: uuid }
 * Creates:
 *   - brand_thumbnail (1792x1024) based on GPT-crafted prompt
 *   - dca_avatar (1024x1024) based on GPT-crafted prompt
 * Backfills:
 *   - folders.cover_image_id
 *   - brands.thumbnail_image_id
 *   - dream_customers.avatar_image_id
 */

// Minimal service you can call from /finalize
export async function generateForFolder({ sb, user_id, folder_id, openai, cloudinary }) {
  // 1) Load folder + brand + dca
  const { data: folder, error: fErr } = await sb
    .from("folders").select("id,user_id,brand_id,dca_id").eq("id", folder_id).maybeSingle();
  if (fErr) throw new Error(`load folder: ${fErr.message}`);
  if (!folder || folder.user_id !== user_id) throw new Error("Folder not found");
  if (!folder.brand_id || !folder.dca_id) throw new Error("Finalize first");

  const [{ data: brand, error: bErr }, { data: dca, error: dErr }] = await Promise.all([
    sb.from("brands").select("*").eq("id", folder.brand_id).maybeSingle(),
    sb.from("dream_customers").select("*").eq("id", folder.dca_id).maybeSingle(),
  ]);
  if (bErr) throw new Error(`load brand: ${bErr.message}`);
  if (dErr) throw new Error(`load dca: ${dErr.message}`);
  if (!brand || !dca) throw new Error("Brand or DCA missing");

  // 2) GPT makes prompts
  const { brandPrompt, brandNegative, brandSize, dcaPrompt, dcaNegative, dcaSize } =
    await getImagePromptsForFolder(openai, brand, dca);

  const ok = new Set(["1024x1024","1792x1024","1024x1792"]);
    if (!ok.has(brandSize) || !ok.has(dcaSize)) {
        throw new Error(`Bad size mapping: brand=${brandSize}, dca=${dcaSize}`);
}

  // 3) Generate images (DALL·E 3)
const [brandBuf, dcaBuf] = await Promise.all([
  dalleBuffer({ openai, prompt: brandPrompt, size: brandSize, negative: brandNegative }),
  dalleBuffer({ openai, prompt: dcaPrompt,   size: dcaSize,   negative: dcaNegative   }),
]);

console.log("isBuffer?", Buffer.isBuffer(brandBuf), Buffer.isBuffer(dcaBuf), brandSize, dcaSize);

  // 4) Upload to Cloudinary
 const [brandUp, dcaUp] = await Promise.all([
  uploadToCloudinaryBuffer({ cloudinary, buffer: brandBuf, publicId: `brand_${folder_id}` }),
  uploadToCloudinaryBuffer({ cloudinary, buffer: dcaBuf,   publicId: `dca_${folder_id}` }),
]);

console.log("cloudinary cloud:", cloudinary.config().cloud_name);


  // 5) Save rows (idempotent) and backfill pointers
  const rows = [
    { user_id, folder_id, brand_id: brand.id, dca_id: null, kind: "brand_thumbnail",
      public_id: brandUp.public_id, format: brandUp.format, version: brandUp.version,
      width: brandUp.width, height: brandUp.height, bytes: brandUp.bytes,
      alt: `${brand.name} thumbnail`, metadata: { prompt: brandPrompt, negative: brandNegative, size: brandSize } },
    { user_id, folder_id, brand_id: null, dca_id: dca.id, kind: "dca_avatar",
      public_id: dcaUp.public_id, format: dcaUp.format, version: dcaUp.version,
      width: dcaUp.width, height: dcaUp.height, bytes: dcaUp.bytes,
      alt: `${dca.name} avatar`, metadata: { prompt: dcaPrompt, negative: dcaNegative, size: dcaSize } },
  ];

  const { data: saved, error: upErr } = await sb
    .from("project_images")
    .upsert(rows, { onConflict: "folder_id,kind" })
    .select("id,kind,public_id");
  if (upErr) throw new Error(`save images: ${upErr.message}`);

  const thumb = saved.find(r => r.kind === "brand_thumbnail");
  const avatar = saved.find(r => r.kind === "dca_avatar");

  await Promise.all([
    sb.from("folders").update({ cover_image_id: thumb?.id ?? null }).eq("id", folder_id),
    sb.from("brands").update({ thumbnail_image_id: thumb?.id ?? null }).eq("id", brand.id),
    sb.from("dream_customers").update({ avatar_image_id: avatar?.id ?? null }).eq("id", dca.id),
  ]);

  return { brand_thumbnail_id: thumb?.id, dca_avatar_id: avatar?.id };
};

export default router;