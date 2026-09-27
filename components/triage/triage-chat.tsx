"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DemoProgress } from "@/components/demo/progress-steps";

type Message = {
  id: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
};

function extractChoices(messages: Message[]): string[] {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant?.metadata) return [];
  const meta = lastAssistant.metadata as {
    question?: { choices?: string[]; expected_answer_type?: string };
    nextQuestion?: { choices?: string[]; expected_answer_type?: string };
  };
  const q = meta.nextQuestion || meta.question;
  if (q?.choices && q.choices.length > 0) return q.choices;
  // Sensible defaults when AI returns a question without choices
  if (lastAssistant.content.toLowerCase().includes("?")) {
    return ["Yes", "No", "Not sure"];
  }
  return [];
}

export function TriageChat({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("TRIAGE");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState("normal");
  const [showType, setShowType] = useState(false);

  const choices = useMemo(() => extractChoices(messages), [messages]);

  async function refresh() {
    const res = await fetch(`/api/incidents?id=${incidentId}`);
    const json = await res.json();
    if (json.ok) {
      setMessages(json.data.messages);
      setStatus(json.data.incident.status);
      const last = [...json.data.messages]
        .reverse()
        .find((m: Message) => m.metadata && (m.metadata as { safety?: { level?: string } }).safety);
      const level = (last?.metadata as { safety?: { level?: string } } | undefined)?.safety
        ?.level;
      if (level) setSafetyLevel(level);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/incidents?id=${incidentId}`);
      const json = await res.json();
      if (!cancelled && json.ok) {
        setMessages(json.data.messages);
        setStatus(json.data.incident.status);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  async function send(content: string) {
    const body = content.trim();
    if (!body || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: body }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      setText("");
      if (json.data.safety?.level) setSafetyLevel(json.data.safety.level);
      await refresh();
      if (json.data.done) {
        router.push(`/incident/${incidentId}/decision`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <DemoProgress current="questions" branch="none" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={safetyLevel === "emergency" ? "danger" : "default"}>
          Safety: {safetyLevel}
        </Badge>
        <Badge variant="outline">{status}</Badge>
      </div>

      <div className="space-y-3 rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4">
        {messages
          .filter((m) => m.role !== "system")
          .map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-6 rounded-md bg-[var(--avero-sand)] p-3 text-sm"
                  : "mr-6 rounded-md border border-[var(--avero-line)] bg-white p-3 text-sm"
              }
            >
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--avero-muted)]">
                {m.role === "user" ? "You" : "Avero"}
              </p>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
        {messages.length === 0 && (
          <p className="text-sm text-[var(--avero-muted)]">Loading…</p>
        )}
        {loading && (
          <p className="text-sm text-[var(--avero-teal)]">Avero is thinking…</p>
        )}
      </div>

      {status !== "EMERGENCY" && choices.length > 0 && !loading && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--avero-ink)]">
            Tap an answer to continue
          </p>
          <div className="flex flex-wrap gap-2">
            {choices.map((c) => (
              <Button
                key={c}
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => send(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
      )}

      {status !== "EMERGENCY" && (
        <div className="space-y-2">
          <button
            type="button"
            className="text-xs text-[var(--avero-muted)] underline"
            onClick={() => setShowType((v) => !v)}
          >
            {showType ? "Hide typed answer" : "Prefer to type instead?"}
          </button>
          {showType && (
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your answer…"
                onKeyDown={(e) => e.key === "Enter" && send(text)}
                disabled={loading}
              />
              <Button onClick={() => send(text)} disabled={loading || !text.trim()}>
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
