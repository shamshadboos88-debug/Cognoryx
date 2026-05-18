// imageGen.js — 100% FREE, no API key needed!
// Uses Pollinations.ai

export async function generateImage(prompt) {
  const encoded = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const timeout = setTimeout(() => {
      reject(new Error("Timed out. Please try again."));
    }, 30000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(url);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      const retryUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed+1}&nologo=true`;
      const retryImg = new Image();
      retryImg.crossOrigin = "anonymous";
      retryImg.onload = () => resolve(retryUrl);
      retryImg.onerror = () => reject(new Error("Failed to generate. Try a different prompt."));
      retryImg.src = retryUrl;
    };

    img.src = url;
  });
}
