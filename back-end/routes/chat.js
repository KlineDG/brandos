import express from "express";
import actionCall from "../lib/textApi.js";
import dotenv from "dotenv";
import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

dotenv.config();

const router = express.Router();
router.use(express.json());

// POST /text – generate text based on chat messages
router.post("/text", async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input format
    if (!Array.isArray(messages) || !messages.every(m => m.role && m.content)) {
      return res.status(400).json({ message: "Invalid messages format. Each message must have 'role' and 'content'." });
    }

    // Generate AI response
    const generatedText = await actionCall(messages);

    // Return response
    res.status(200).json({ text: generatedText });
  } catch (error) {
    console.error("Error generating text:", error);

    // OpenAI-specific error info if available
    const status = error?.status || 500;
    const message = error?.message || "Internal server error";

    res.status(status).json({ message });
  }
});


router.post("/summarize", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.some(m => !m.role || typeof m.content !== "string")) {
      return res.status(400).json({ message: "Invalid messages format. Each message must have a role and string content." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Cheaper & faster model for summarization
      messages: [
        { role: "system", content: "Summarize this conversation concisely for memory purposes. Be objective and capture the key ideas. Make it as short as you can without loss of clarity." },
        ...messages
      ],
    });

    const summary = response.choices[0]?.message?.content?.trim() || "No summary.";

    res.status(200).json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({ message: "Failed to summarize" });
  }
});

export default router;