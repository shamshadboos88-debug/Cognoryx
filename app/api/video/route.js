import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function generateKlingToken(accessKey, secretKey) {
  const payload = {
    iss: accessKey,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5,
  };
  return jwt.sign(payload, secretKey, { algorithm: "HS256" });
}

export async function POST(request) {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    return NextResponse.json({ error: "Kling API keys not set." }, { status: 500 });
  }

  let imageBase64, prompt;
  try {
    const body = await request.json();
    imageBase64 = body?.imageUrl;
    prompt = body?.prompt || "cinematic motion, smooth camera movement";
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    // Upload to imgbb to get public URL (free, no auth needed)
    const imgbbKey = process.env.IMGBB_API_KEY;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const formData = new FormData();
    formData.append("image", base64Data);

    const uploadRes = await fetch(
      `https://api.imgbb.com/1/upload?key=${imgbbKey}`,
      { method: "POST", body: formData }
    );
    const uploadData = await uploadRes.json();
    const publicUrl = uploadData?.data?.url;
    console.log("[/api/video] Image URL:", publicUrl);

    if (!publicUrl) {
      return NextResponse.json({ error: "Image upload failed." }, { status: 502 });
    }

    // Call Kling with public URL
    const token = generateKlingToken(accessKey, secretKey);
    const res = await fetch("https://api.klingai.com/v1/videos/image2video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: "kling-v1",
        image: publicUrl,
        prompt: prompt,
        duration: "5",
        mode: "std",
        cfg_scale: 0.5,
      }),
    });

    const data = await res.json();
    console.log("[/api/video] Kling response:", JSON.stringify(data));

    if (!res.ok || !data?.data?.task_id) {
      return NextResponse.json({
        error: data?.message || JSON.stringify(data)
      }, { status: 502 });
    }

    const taskId = data.data.task_id;

    // Poll for result
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollToken = generateKlingToken(accessKey, secretKey);
      const poll = await fetch(
        `https://api.klingai.com/v1/videos/image2video/${taskId}`,
        { headers: { Authorization: `Bearer ${pollToken}` } }
      );
      const pollData = await poll.json();
      const status = pollData?.data?.task_status;
      console.log("[/api/video] Poll", i, "status:", status);

      if (status === "succeed") {
        const videoUrl = pollData?.data?.task_result?.videos?.[0]?.url;
        return NextResponse.json({ videoUrl });
      }
      if (status === "failed") {
        return NextResponse.json({ error: "Generation failed." }, { status: 502 });
      }
    }

    return NextResponse.json({ error: "Timeout. Try again." }, { status: 504 });

  } catch (e) {
    console.error("[/api/video] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST." }, { status: 405 });
}