// prompts/art.js

export const IMAGE_PROMPTS_SYSTEM = `Return JSON ONLY:
{"brand_thumbnail":{"prompt":string,"negative":string,"aspect_ratio":"16:9"|"1:1"|"9:16"},
 "dca_avatar":{"prompt":string,"negative":string,"aspect_ratio":"1:1"}}
Concise (1–3 sentences). No logos/text.`;

export function buildImagePromptsUser(brand, dca) {
  return `BRAND:\n${JSON.stringify({
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
}
