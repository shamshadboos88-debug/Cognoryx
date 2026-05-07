// app/api/animation/route.js — Replicate
import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) return NextResponse.json({ error: "REPLICATE_API_TOKEN not set." }, { status: 500 });
  let prompt;
  try { const body = await request.json(); prompt = body?.prompt?.trim(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!prompt) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  try {
    // Start prediction
    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351", input: { prompt, num_frames: 24, fps: 8 } }),
    });
    if (!res.ok) { const t = await res.text(); console.error("[/api/animation] Replicate error:", t); return NextResponse.json({ error: "Animation generation failed." }, { status: 502 }); }
    const prediction = await res.json();
    // Poll for completion
    let result = prediction;
    for (let i = 0; i < 30; i++) {
      if (result.status === "succeeded") break;
      if (result.status === "failed") throw new Error("Prediction failed");
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, { headers: { Authorization: `Token ${apiKey}` } });
      result = await poll.json();
    }
    return NextResponse.json({ animationUrl: result.output });
  } catch (e) { console.error("[/api/animation]", e); return NextResponse.json({ error: "Animation generation failed." }, { status: 502 }); }
}
export async function GET() { return NextResponse.json({ error: "Use POST." }, { status: 405 }); }
