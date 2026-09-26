"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
};

export function TriageChat({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("TRIAGE");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState("normal");

  async function refresh() {
    const res = await fetch(`/api/incidents?id=${incidentId}`);
    const json = await res.json();
    if (json.ok) {
      setMessages(json.data.messages);
      setStatus(json.data.incident.status);
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

  async function send() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
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
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={safetyLevel === "emergency" ? "danger" : "default"}>
          Safety: {safetyLevel}
        </Badge>
        <Badge variant="outline">Status: {status}</Badge>
      </div>
      <div className="space-y-3 rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-md bg-[var(--avero-sand)] p-3 text-sm"
                : "mr-8 rounded-md border border-[var(--avero-line)] bg-white p-3 text-sm"
            }
          >
            <p className="mb-1 text-xs uppercase tracking-wide text-[var(--avero-muted)]">
              {m.role}
            </p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-[var(--avero-muted)]">Loading conversation…</p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your answer…"
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading || status === "EMERGENCY"}
        />
        <Button onClick={send} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
}
