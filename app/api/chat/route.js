import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

const SYSTEM_PROMPT = `You are COGNORYX AI, a powerful all-in-one AI assistant built for the future.
You CAN see and analyze images, documents, videos, and files when they are shared with you.
When a user shares an image or video, ALWAYS analyze it in detail.
Never say you cannot see images or videos. You have full vision capabilities.
Be helpful, smart, concise, and friendly.`;

const CODE_PROMPT = `You are COGNORYX Code Agent, an expert software engineer.
You specialize in analyzing large codebases, fixing bugs across multiple files, writing clean production-ready code, and explaining complex technical concepts.
Always provide complete working code. Use markdown code blocks. Be precise and thorough.`;

const AGENT_PROMPT = `You are the COGNORYX Agent Coordinator. 
You break down complex tasks into clear sequential steps, execute each step thoroughly, and produce comprehensive results.
For each task: 1) Plan the approach 2) Execute step by step 3) Review and summarize results.
Be thorough, autonomous, and produce complete deliverables.`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, attachment, mode, stream: wantStream } = body;

    const hasAttachment = !!attachment;
    const isImage = attachment?.type?.startsWith("image/");
    const isVideo = attachment?.type?.startsWith("video/");
    const isFile  = hasAttachment && !isImage && !isVideo;

    // Pick system prompt based on mode
    const systemPrompt =
      mode === "code"  ? CODE_PROMPT  :
      mode === "agent" ? AGENT_PROMPT :
      SYSTEM_PROMPT;

    // =========================================================
    // IMAGE / VIDEO / FILE → GEMINI (vision)
    // =========================================================
    if (hasAttachment) {
      try {
        if (!gemini) throw new Error("Gemini key missing");

        const model = gemini.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
        });

        const userText = message ||
          (isVideo ? "Please analyze this video in detail — describe what happens, any UI, actions, bugs, or relevant content." :
           isImage ? "Please analyze this image in detail." :
           "Please analyze this file.");

        const result = await model.generateContent([
          { inlineData: { data: attachment.base64, mimeType: attachment.type } },
          { text: userText },
        ]);

        return Response.json({ reply: result.response.text(), provider: "Gemini Flash", mode });

      } catch (err) {
        console.error("[Gemini Vision Error]", err.message);
      }
    }

    // =========================================================
    // STREAMING — fast word-by-word response
    // =========================================================
    if (wantStream) {
      // Try DeepSeek streaming first
      if (deepseek) {
        try {
          const stream = await deepseek.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: message || "Hello" },
            ],
            stream: true,
            max_tokens: 4096,
            temperature: mode === "code" ? 0.2 : 0.7,
          });

          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  const text = chunk.choices[0]?.delta?.content || "";
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
          });

        } catch (err) {
          console.error("[DeepSeek Stream Error]", err.message);
        }
      }

      // Groq streaming fallback
      if (groq) {
        try {
          const stream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: message || "Hello" },
            ],
            stream: true,
            max_tokens: 4096,
          });

          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  const text = chunk.choices[0]?.delta?.content || "";
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
          });

        } catch (err) {
          console.error("[Groq Stream Error]", err.message);
        }
      }
    }

    // =========================================================
    // NON-STREAMING fallback
    // =========================================================

    // DeepSeek V4 Flash
    if (deepseek) {
      try {
        const completion = await deepseek.chat.completions.create({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: message || "Hello" },
          ],
          max_tokens: 4096,
          temperature: mode === "code" ? 0.2 : 0.7,
        });

        return Response.json({
          reply: completion.choices[0].message.content,
          provider: "DeepSeek V4 Flash",
          mode,
        });

      } catch (err) {
        console.error("[DeepSeek Error]", err.message);
      }
    }

    // Gemini fallback
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(message || "Hello");
        return Response.json({ reply: result.response.text(), provider: "Gemini Flash", mode });
      } catch (err) {
        console.error("[Gemini Fallback Error]", err.message);
      }
    }

    return Response.json({ reply: "⚠️ All AI providers unavailable. Please try again." });

  } catch (error) {
    console.error("[Route Error]", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}