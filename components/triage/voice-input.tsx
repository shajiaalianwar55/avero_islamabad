"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{
          isFinal: boolean;
          0: { transcript: string };
        }>;
      }) => void)
    | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

/**
 * Optional voice input — browser SpeechRecognition when available.
 * Delivers one final transcript per listen session so text is not duplicated.
 * Failure never blocks typing.
 */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const transcriptRef = useRef("");

  function start() {
    setError(null);
    transcriptRef.current = "";

    const win = typeof window !== "undefined" ? window : null;
    const SR = win as unknown as {
      webkitSpeechRecognition?: new () => SpeechRec;
      SpeechRecognition?: new () => SpeechRec;
    } | null;

    const Ctor = SR?.SpeechRecognition || SR?.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice not available in this browser — type instead.");
      return;
    }

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0]?.transcript ?? "";
      }
      transcriptRef.current = text.trim();
    };

    rec.onerror = () => {
      setError("Voice failed — type instead.");
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) onText(finalText);
      transcriptRef.current = "";
    };

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
