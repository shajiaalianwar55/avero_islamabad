"use client";

/** Browser TTS — cancel any playing speech first. */
export function speak(text: string, opts?: { lang?: string; rate?: number }): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts?.lang ?? "en-US";
    u.rate = opts?.rate ?? 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

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
  abort?: () => void;
};

export function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const SR = window as unknown as {
    webkitSpeechRecognition?: new () => SpeechRec;
    SpeechRecognition?: new () => SpeechRec;
  };
  return SR.SpeechRecognition || SR.webkitSpeechRecognition || null;
}

/** One-shot listen; returns final transcript or empty string. */
export function listenOnce(opts?: { lang?: string; timeoutMs?: number }): Promise<string> {
  return new Promise((resolve) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      resolve("");
      return;
    }

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = opts?.lang ?? "en-US";
    let finalText = "";
    let settled = false;

    const finish = (text: string) => {
      if (settled) return;
      settled = true;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      resolve(text.trim());
    };

    const timer = window.setTimeout(() => finish(finalText), opts?.timeoutMs ?? 12000);

    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0]?.transcript ?? "";
      }
      finalText = text.trim();
      const last = e.results[e.results.length - 1];
      if (last?.isFinal) {
        window.clearTimeout(timer);
        finish(finalText);
      }
    };

    rec.onerror = () => {
      window.clearTimeout(timer);
      finish(finalText);
    };

    rec.onend = () => {
      window.clearTimeout(timer);
      finish(finalText);
    };

    try {
      rec.start();
    } catch {
      window.clearTimeout(timer);
      finish("");
    }
  });
}

/** Pick best matching option label from spoken text. */
export function matchSpokenChoice<T extends { id: string; label: string }>(
  spoken: string,
  options: T[]
): T | null {
  const t = spoken.toLowerCase().trim();
  if (!t) return null;

  // "option 1" / "number two" / "1"
  const numWords: Record<string, number> = {
    one: 1,
    first: 1,
    two: 2,
    second: 2,
    three: 3,
    third: 3,
    four: 4,
    fourth: 4,
  };
  const digit = t.match(/\b([1-4])\b/);
  if (digit) {
    const i = Number(digit[1]) - 1;
    if (options[i]) return options[i];
  }
  for (const [word, n] of Object.entries(numWords)) {
    if (t.includes(word) && options[n - 1]) return options[n - 1];
  }

  // Fuzzy: most label word overlap
  let best: T | null = null;
  let bestScore = 0;
  for (const opt of options) {
    const words = opt.label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
    let score = 0;
    for (const w of words) {
      if (t.includes(w)) score += 1;
    }
    if (opt.label.toLowerCase().includes(t) || t.includes(opt.label.toLowerCase().slice(0, 20))) {
      score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }
  return bestScore > 0 ? best : null;
}
