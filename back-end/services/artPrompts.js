// services/artPrompts.js
import openai from "../lib/openai.js";
import { sizeForAR } from "../lib/image.js";
import { IMAGE_PROMPTS_SYSTEM, buildImagePromptsUser } from "../prompts/art.js";

export async function getImagePromptsForFolder(brand, dca) {
  const system = IMAGE_PROMPTS_SYSTEM;
  const user = buildImagePromptsUser(brand, dca);

  const resp = await openai.chat.completions.create({
    model: "gpt-4o", // or "gpt-4o-mini",
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
