import dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;



if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Handles AI response generation using OpenAI GPT-4o
 * @param {{ role: string, content: string }[]} messages
 * @returns {Promise<string>} AI response
 */
const actionCall = async (messages) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for best quality
      messages: messages, // Already in [{ role, content }] format
    });

    return response.choices[0].message?.content?.trim() || "No response.";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "Error: Unable to generate a response.";
  }
};

export default actionCall;