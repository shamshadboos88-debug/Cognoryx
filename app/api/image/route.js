import { NextResponse } from "next/server";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });

  let message, fileBase64, fileType;
  try {
    const body = await request.json();
    message   = body?.message?.trim();
    fileBase64 = body?.fileBase64;
    fileType  = body?.fileType;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!message && !fileBase64) {
    return NextResponse.json({ error: "Message or file is required." }, { status: 400 });
  }

  try {
    // Build parts array
    const parts = [];

    // Add file if provided
    if (fileBase64 && fileType) {
      const base64Data = fileBase64.split(",")[1] || fileBase64;
      if (fileType.startsWith("image/")) {
        parts.push({
          inlineData: {
            mimeType: fileType,
            data: base64Data,
          }
        });
      } else if (fileType === "application/pdf") {
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          }
        });
      }
    }

    // Add text message
    if (message) {
      parts.push({ text: message });
    } else {
      parts.push({ text: "Please analyze this file and describe what you see." });
    }

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        systemInstruction: {
          parts: [{ text: "You are COGNORYX, an advanced AI assistant. Be helpful, intelligent, and concise. Format responses clearly." }]
        }
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("[/api/chat] Gemini error:", res.status, t);
      return NextResponse.json({
        error: res.status === 429 ? "Rate limit exceeded." : "AI service error."
      }, { status: res.status === 429 ? 429 : 502 });
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("[/api/chat] No reply:", JSON.stringify(data));
      return NextResponse.json({ error: "No response generated." }, { status: 502 });
    }

    return NextResponse.json({ reply }, { status: 200 });

  } catch (e) {
    console.error("[/api/chat] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST." }, { status: 405 });
}