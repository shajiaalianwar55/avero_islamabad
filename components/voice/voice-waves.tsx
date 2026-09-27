"use client";

import { cn } from "@/lib/utils";

type WaveState = "idle" | "speaking" | "listening";

const BARS = 7;

/** Animated voice bars — speaking vs listening feel different. */
export function VoiceWaves({
  state,
  className,
}: {
  state: WaveState;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-20 items-center justify-center gap-1.5", className)}
      aria-hidden
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-[var(--avero-teal)]",
            state === "idle" && "h-2 opacity-35",
            state === "speaking" && "animate-voice-speak opacity-90",
            state === "listening" && "animate-voice-listen opacity-95"
          )}
          style={
            state === "idle"
              ? undefined
              : { animationDelay: `${i * 80}ms` }
          }
        />
      ))}
    </div>
  );
}
