// schemas/brand.js

export const PlatformItem = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
});

export const BrandZ = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  product_type: z.string().min(1),
  features: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  differentiation: z.string().min(1),
  tone_of_voice: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  values: z.array(z.string()).optional().default([]),
  competitors: z.array(z.string()).optional().default([]),
  target_audience: z.string().optional().default(""),
  target_platforms: z.array(PlatformItem).optional().default([]),
  stage: z.enum(["idea", "prototype", "launched", "growth"]).optional().default("idea"),
  system_prompt: z.string().optional().default(""),
  onboarding_summary: z.string().optional().default(""),
  metadata: z.record(z.any()).optional().default({}),
});

export const DcaZ = z.object({
  name: z.string().min(1),
  demographics: z.record(z.any()).optional().default({}),
  career: z.record(z.any()).optional().default({}),
  psychographics: z.record(z.any()).optional().default({}),
  digital_behavior: z.record(z.any()).optional().default({}),
  buying_behavior: z.record(z.any()).optional().default({}),
  pain_points: z.array(z.string()).optional().default([]),
  backstory: z.string().optional().default(""),
  system_prompt: z.string().optional().default(""),
  metadata: z.record(z.any()).optional().default({}),
});

export const FinalZ = z.object({ brand: BrandZ, dca: DcaZ });