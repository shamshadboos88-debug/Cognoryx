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

const ARIA_PROMPT = `You are Aria, the intelligent voice AI assistant for COGNORYX — a premium AI platform.
You are warm, friendly, smart, and helpful. You speak in short natural sentences perfect for voice conversation.
Keep ALL replies to 1-3 sentences maximum. Never use bullet points or markdown — speak naturally.
Be conversational, helpful, and concise.`;

export async function POST(req) {
  try {
    const body = await req.json();

    // ✅ Support BOTH single message (chat) AND messages array (Aria/Live)
    const {
      message,        // single string — from chat/code/agent
      messages,       // array — from Aria LiveTool: [{role, content}]
      attachment,
      mode,
      stream: wantStream,
      systemPrompt: customSystemPrompt,  // Aria sends its own system prompt
    } = body;

    // Build the final text to send
    const userText = message || (Array.isArray(messages) ? messages[messages.length - 1]?.content : null) || "Hello";

    const hasAttachment = !!attachment;
    const isImage = attachment?.type?.startsWith("image/");
    const isVideo = attachment?.type?.startsWith("video/");

    // Pick system prompt
    const systemPrompt =
      customSystemPrompt ? customSystemPrompt :  // Aria sends its own
      mode === "code"    ? CODE_PROMPT  :
      mode === "agent"   ? AGENT_PROMPT :
      SYSTEM_PROMPT;

    // Build messages array for OpenAI-compatible APIs
    // If Aria sends full history, use it — otherwise just single message
    const buildMessages = (sysPrompt) => {
      const sys = { role: "system", content: sysPrompt };
      if (Array.isArray(messages) && messages.length > 0) {
        // Aria: full conversation history
        return [sys, ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))];
      }
      return [sys, { role: "user", content: userText }];
    };

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
        const prompt = message ||
          (isVideo ? "Please analyze this video in detail — describe what happens, any UI, actions, bugs, or relevant content." :
           isImage ? "Please analyze this image in detail." :
           "Please analyze this file.");

        const result = await model.generateContent([
          { inlineData: { data: attachment.base64, mimeType: attachment.type } },
          { text: prompt },
        ]);
        return Response.json({ reply: result.response.text(), provider: "Gemini Flash", mode });
      } catch (err) {
        console.error("[Gemini Vision Error]", err.message);
      }
    }

    // =========================================================
    // STREAMING — word-by-word (chat/code/agent modes)
    // =========================================================
    if (wantStream) {
      // DeepSeek streaming
      if (deepseek) {
        try {
          const stream = await deepseek.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: buildMessages(systemPrompt),
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
                  if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
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
            messages: buildMessages(systemPrompt),
            stream: true,
            max_tokens: 4096,
          });

          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  const text = chunk.choices[0]?.delta?.content || "";
                  if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
          });
        } catch (err) {
          console.error("[Groq Stream Error]", err.message);
        }
      }
    }

    // =========================================================
    // NON-STREAMING — Aria uses this (stream: false)
    // =========================================================

    // DeepSeek
    if (deepseek) {
      try {
        const completion = await deepseek.chat.completions.create({
          model: "deepseek-v4-flash",
          messages: buildMessages(systemPrompt),
          max_tokens: 512,   // short for voice
          temperature: 0.8,
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
        const result = await model.generateContent(userText);
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