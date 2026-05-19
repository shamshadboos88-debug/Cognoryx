import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// ================= GEMINI (Image analysis + Live) =================
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ================= DEEPSEEK V4 Flash (Chat messages) =================
const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    })
  : null;

const SYSTEM_PROMPT = `You are COGNORYX AI, a powerful all-in-one AI assistant.
You CAN see and analyze images, documents, and files when they are shared with you.
When a user shares an image, ALWAYS analyze it in detail — describe what you see, colors, objects, text, mood, composition, and anything relevant.
Never say you cannot see images. You have full vision capabilities.
Be helpful, smart, and concise.`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, attachment } = body;

    const hasAttachment = !!attachment;
    const isImage = attachment?.type?.startsWith("image/");

    // =====================================================
    // 1. IMAGE/FILE → GEMINI FLASH (vision support)
    // =====================================================
    if (hasAttachment) {
      try {
        if (!gemini) throw new Error("Gemini API key missing");

        const model = gemini.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: SYSTEM_PROMPT,
        });

        const userText = message || (isImage
          ? "Please analyze this image in detail — describe everything you see."
          : "Please analyze this file.");

        const result = await model.generateContent([
          {
            inlineData: {
              data: attachment.base64,
              mimeType: attachment.type,
            },
          },
          { text: userText },
        ]);

        return Response.json({
          reply: result.response.text(),
          provider: "Gemini Flash",
        });

      } catch (err) {
        console.error("[Gemini Image Error]", err.message);
        // fall through to DeepSeek as backup
      }
    }

    // =====================================================
    // 2. CHAT TEXT → DEEPSEEK V4 FLASH (best quality/price)
    // =====================================================
    try {
      if (!deepseek) throw new Error("DeepSeek API key missing");

      const completion = await deepseek.chat.completions.create({
        model: "deepseek-v4-flash", // ✅ updated from deprecated deepseek-chat
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message || "Hello" },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });

      return Response.json({
        reply: completion.choices[0].message.content,
        provider: "DeepSeek V4 Flash",
      });

    } catch (err) {
      console.error("[DeepSeek Error]", err.message);
    }

    // =====================================================
    // 3. FALLBACK → GEMINI (if DeepSeek fails)
    // =====================================================
    try {
      if (!gemini) throw new Error("Gemini API key missing");

      const model = gemini.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(message || "Hello");

      return Response.json({
        reply: result.response.text(),
        provider: "Gemini Flash",
      });

    } catch (err) {
      console.error("[Gemini Fallback Error]", err.message);
    }

    // ALL FAILED
    return Response.json({
      reply: "⚠️ All AI providers are currently unavailable. Please try again.",
    });

  } catch (error) {
    console.error("[Route Error]", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}