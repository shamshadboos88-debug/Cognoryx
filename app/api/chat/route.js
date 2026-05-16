import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// ================= GEMINI =================
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ================= GROQ =================
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

// ================= DEEPSEEK =================
const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    })
  : null;

export async function POST(req) {

  try {

    const body = await req.json();

    const {
      message,
      attachment,
    } = body;

    // =====================================================
    // 1. TRY GEMINI
    // =====================================================

    try {

      if (!gemini) {
        throw new Error("Gemini API key missing");
      }

      const model = gemini.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      let result;

      // ===== FILE SUPPORT =====
      if (attachment) {

        result = await model.generateContent([
          {
            inlineData: {
              data: attachment.base64,
              mimeType: attachment.type,
            },
          },
          {
            text: message || "Analyze this file",
          },
        ]);

      } else {

        result = await model.generateContent(
          message || "Hello"
        );

      }

      return Response.json({
        reply: result.response.text(),
        provider: "Gemini",
      });

    } catch (err) {

      console.error("[Gemini Error]", err.message);

    }

    // =====================================================
    // 2. TRY GROQ
    // =====================================================

    try {

      if (!groq) {
        throw new Error("Groq API key missing");
      }

      const completion =
        await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: message || "Hello",
            },
          ],
        });

      return Response.json({
        reply:
          completion.choices[0].message.content,
        provider: "Groq",
      });

    } catch (err) {

      console.error("[Groq Error]", err.message);

    }

    // =====================================================
    // 3. TRY DEEPSEEK
    // =====================================================

    try {

      if (!deepseek) {
        throw new Error("DeepSeek API key missing");
      }

      const completion =
        await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: message || "Hello",
            },
          ],
        });

      return Response.json({
        reply:
          completion.choices[0].message.content,
        provider: "DeepSeek",
      });

    } catch (err) {

      console.error("[DeepSeek Error]", err.message);

    }

    // =====================================================
    // ALL FAILED
    // =====================================================

    return Response.json({
      reply:
        "⚠️ All AI providers are currently unavailable.",
    });

  } catch (error) {

    console.error("[Route Error]", error);

    return Response.json(
      {
        error: "AI request failed",
      },
      {
        status: 500,
      }
    );

  }

}