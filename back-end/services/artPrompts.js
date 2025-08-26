// services/artPrompts.js
import openai from "../lib/openai.js";

function sizeForAR(ar) {
  const s = (ar || "").trim();
  if (s === "16:9") return "1792x1024";
  if (s === "9:16") return "1024x1792";
  return "1024x1024"; // 1:1 default
}

export async function getImagePromptsForFolder(brand, dca) {
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
