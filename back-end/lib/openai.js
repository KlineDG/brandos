// lib/openai.js

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Call OpenAI with a chat completion.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model
 * @returns {Promise<string>}
 */
export async function getChatCompletion(messages, model = "gpt-4o-mini") {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
    });
    return response.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("OpenAI chat error:", err);
    throw new Error("AI request failed");
  }
}

/**
 * Call OpenAI with strict JSON output.
 */
export async function getChatJSON(messages, model = "gpt-4o-mini") {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0,
    });
    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.error("OpenAI JSON error:", err);
    throw new Error("AI JSON request failed");
  }
}

export default openai;
