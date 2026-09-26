"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Optional voice input stub — browser SpeechRecognition when available.
 * Failure never blocks typing.
 */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  function start() {
    setError(null);
    const SR =
      typeof window !== "undefined"
        ? (window as unknown as {
            webkitSpeechRecognition?: new () => {
              continuous: boolean;
              interimResults: boolean;
              onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
              onerror: (() => void) | null;
              onend: (() => void) | null;
              start: () => void;
            };
            SpeechRecognition?: new () => {
              continuous: boolean;
              interimResults: boolean;
              onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
              onerror: (() => void) | null;
              onend: (() => void) | null;
              start: () => void;
            };
          })
        : null;

    const Ctor = SR?.SpeechRecognition || SR?.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice not available in this browser — type instead.");
      return;
    }

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) onText(transcript);
    };
    rec.onerror = () => setError("Voice failed — type instead.");
    rec.onend = () => setListening(false);
    setListening(true);
    try {
      rec.start();
    } catch {
      setError("Voice failed — type instead.");
      setListening(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" variant="secondary" onClick={start} disabled={listening}>
        {listening ? "Listening…" : "Voice (optional)"}
      </Button>
      {error && <p className="text-xs text-[var(--avero-alert)]">{error}</p>}
    </div>
  );
}
