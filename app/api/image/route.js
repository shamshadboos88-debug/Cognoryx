// app/api/image/route.js
// Uses Pollinations.ai — 100% FREE, no API key needed, high quality images
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'flux' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    // Pollinations.ai — free, no key, supports flux model (best quality)
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);

    // Return the image URL directly — Pollinations generates on-demand
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // Verify it works by doing a HEAD request
    try {
      const check = await fetch(imageUrl, { method: 'HEAD' });
      if (check.ok) {
        return NextResponse.json({ imageUrl, prompt, model: 'pollinations-flux' });
      }
    } catch {
      // If HEAD fails, still return URL — browser will load it directly
    }

    return NextResponse.json({ imageUrl, prompt, model: 'pollinations-flux' });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
