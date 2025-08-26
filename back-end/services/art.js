// services/art.js


import { getImagePromptsForFolder } from "../services/artPrompts.js";
import { dalleBuffer, uploadToCloudinaryBuffer } from "../services/imageGeneration.js";


export async function generateForFolder({ sb, user_id, folder_id }) {
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
    await getImagePromptsForFolder(brand, dca);

  const ok = new Set(["1024x1024","1792x1024","1024x1792"]);
  if (!ok.has(brandSize) || !ok.has(dcaSize)) {
    throw new Error(`Bad size mapping: brand=${brandSize}, dca=${dcaSize}`);
  }

  // 3) Generate images (DALL·E 3)
  const [brandBuf, dcaBuf] = await Promise.all([
    dalleBuffer({ prompt: brandPrompt, size: brandSize, negative: brandNegative }),
    dalleBuffer({ prompt: dcaPrompt,   size: dcaSize,   negative: dcaNegative   }),
  ]);

  console.log("isBuffer?", Buffer.isBuffer(brandBuf), Buffer.isBuffer(dcaBuf), brandSize, dcaSize);

  // 4) Upload to Cloudinary
  const [brandUp, dcaUp] = await Promise.all([
    uploadToCloudinaryBuffer({ buffer: brandBuf, publicId: `brand_${folder_id}` }),
    uploadToCloudinaryBuffer({ buffer: dcaBuf,   publicId: `dca_${folder_id}` }),
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
}

