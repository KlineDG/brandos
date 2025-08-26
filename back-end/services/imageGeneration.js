// services/imageGeneration.js

import openai from "../lib/openai.js";
import cloudinary from "../lib/cloudinary.js";

// 1) DALL·E 3: always return a Buffer
export async function dalleBuffer({ prompt, size = "1024x1024", negative = "" }) {
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
export async function uploadToCloudinaryBuffer({ buffer, publicId, folder = "brandos" }) {
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

