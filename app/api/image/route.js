// app/api/image/route.js
// Uses Pollinations.ai — 100% FREE, no API key needed
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'flux' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const seed = Math.floor(Math.random() * 999999);

    // Build the image URL — Pollinations generates on-demand via GET
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

    // Do a real GET request with a 25s timeout to pre-warm the image
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(imageUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        return NextResponse.json({ imageUrl, prompt, model: 'pollinations-flux' });
      }

      // If that model failed, fallback to turbo
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=turbo&seed=${seed}&nologo=true`;
      return NextResponse.json({ imageUrl: fallbackUrl, prompt, model: 'pollinations-turbo' });

    } catch (fetchErr) {
      clearTimeout(timeout);
      // Even if fetch times out, return the URL — browser can load it directly
      // Pollinations sometimes takes long on server but works fine in browser
      return NextResponse.json({ imageUrl, prompt, model: 'pollinations-flux' });
    }

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}