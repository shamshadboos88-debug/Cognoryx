"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";

export default function SpeakButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = () => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.lang.includes("en") &&
        voice.name.toLowerCase().includes("google")
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <button
      onClick={speaking ? stop : speak}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 transition"
    >
      {speaking ? <Square size={18} /> : <Volume2 size={18} />}
      {speaking ? "Stop" : "Listen"}
    </button>
  );
}