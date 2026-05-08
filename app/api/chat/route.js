import { NextResponse } from "next/server";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });

  let message, fileBase64, fileType;
  try {
    const body = await request.json();
    message    = body?.message?.trim();
    fileBase64 = body?.fileBase64;
    fileType   = body?.fileType;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!message && !fileBase64) {
    return NextResponse.json({ error: "Message or file is required." }, { status: 400 });
  }

  try {
    const parts = [];

    // Add image if provided
    if (fileBase64 && fileType && fileType.startsWith("image/")) {
      // Clean base64 - remove data URL prefix
      const base64Clean = fileBase64.includes(",")
        ? fileBase64.split(",")[1]
        : fileBase64;

      // Validate size - Gemini max is 4MB base64
      if (base64Clean.length > 4000000) {
        return NextResponse.json({ 
          error: "Image too large. Please use an image under 3MB." 
        }, { status: 400 });
      }

      parts.push({
        inlineData: {
          mimeType: fileType,
          data: base64Clean,
        }
      });
    }

    // Add PDF if provided
    if (fileBase64 && fileType === "application/pdf") {
      const base64Clean = fileBase64.includes(",")
        ? fileBase64.split(",")[1]
        : fileBase64;
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64Clean,
        }
      });
    }

    // Add text message
    parts.push({
      text: message || "Please analyze this and describe what you see in detail."
    });

    console.log("[/api/chat] Parts count:", parts.length, "Has file:", !!fileBase64);

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: parts
        }],
        systemInstruction: {
          parts: [{
            text: `You are COGNORYX, an advanced AI assistant created by Kisan Mahendra Sahu, the founder and CEO of COGNORYX. COGNORYX is an all-in-one AI platform built in India. 

Key facts about you:
- Your name is COGNORYX
- You were created by Kisan Mahendra Sahu
- You are built and owned by COGNORYX AI, India
- You can chat, analyze images, generate content, and much more
- You are powered by advanced AI technology
- You should NEVER say you are made by Google, Anthropic, or any other company
- Always say you are COGNORYX AI, created by Kisan Mahendra Sahu

When someone asks who made you, who your founder is, or who owns you — always say:
"I am COGNORYX AI, founded and created by Kisan Kumar Mahendra Sahu, founder and CEO of COGNORYX AI."

You can see and analyze images perfectly. When given an image with math problems or text, read and solve everything you see. Be helpful, intelligent, and concise.`
          }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    const responseText = await res.text();
    console.log("[/api/chat] Status:", res.status);

    if (!res.ok) {
      console.error("[/api/chat] Error:", responseText);
      // Parse error message from Gemini
      try {
        const errData = JSON.parse(responseText);
        const errMsg = errData?.error?.message || "AI service error.";
        return NextResponse.json({ error: errMsg }, { status: 502 });
      } catch {
        return NextResponse.json({ error: "AI service error." }, { status: 502 });
      }
    }

    const data = JSON.parse(responseText);
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("[/api/chat] No reply in response");
      return NextResponse.json({ error: "No response generated." }, { status: 502 });
    }

    return NextResponse.json({ reply }, { status: 200 });

  } catch (e) {
    console.error("[/api/chat] Exception:", e.message);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST." }, { status: 405 });
}