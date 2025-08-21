// lib/textApi.js

import dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Calls OpenAI with messages, returns model response
 * @param {{ role: "system"|"user"|"assistant", content: string }[]} messages
 * @param {object} [opts]
 * @param {string} [opts.model="gpt-4o"]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<string>}
 */
export async function actionCall(messages, opts = {}) {
  if (!Array.isArray(messages)) {
    throw new Error("messages must be an array");
  }
  for (const m of messages) {
    if (!m.role || !m.content) {
      throw new Error("Each message must have a role and content");
    }
  }

  const { model = "gpt-4o", timeoutMs = 30000 } = opts;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await openai.chat.completions.create(
      {
        model,
        messages,
      },
      { signal: controller.signal }
    );

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("OpenAI error:", err);

    // fallback to smaller model if available
    if (model !== "gpt-4o") {
      return "Error: Unable to generate a response.";
    }
    try {
      console.warn("Retrying with gpt-4o-mini...");
      const fallback = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });
      return fallback.choices[0]?.message?.content?.trim() || "";
    } catch (err2) {
      console.error("Fallback failed:", err2);
      return "Error: Unable to generate a response.";
    }
  } finally {
    clearTimeout(id);
  }
}
