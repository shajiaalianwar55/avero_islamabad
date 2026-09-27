"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DemoProgress } from "@/components/demo/progress-steps";
import { ISLAMABAD_AREAS } from "@/types";

const QUICK = [
  "Kitchen sink leaking when water runs",
  "AC airflow weak, filter appears dirty, no electrical warning signs",
  "Socket buzzing and burning smell",
];

export function IncidentForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("F-10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, area }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      const id = json.data.incident.id as string;
      const emergency =
        json.data.safety?.stop_troubleshooting ||
        json.data.safety?.level === "emergency";
      if (emergency) {
        router.push(`/incident/${id}/decision`);
      } else {
        router.push(`/incident/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DemoProgress current="report" branch="none" />
      <div className="space-y-2">
        <Label htmlFor="area">Islamabad area</Label>
        <select
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="flex h-10 w-full rounded-md border border-[var(--avero-line)] bg-white px-3 text-sm"
        >
          {ISLAMABAD_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Quick examples (tap to fill)</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              className="rounded-md border border-[var(--avero-line)] bg-[var(--avero-panel)] px-3 py-2 text-left text-xs hover:border-[var(--avero-teal)]"
              onClick={() => setDescription(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">What is wrong?</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the problem in plain language…"
          required
        />
      </div>
      <button
        type="button"
        className="text-xs text-[var(--avero-muted)] underline"
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? "Hide extras" : "Voice / photo (optional)"}
      </button>
      {showMore && (
        <p className="text-xs text-[var(--avero-muted)]">
          For live demos, prefer the quick examples above — voice and photo are optional
          and never required.
        </p>
      )}
      {error && <p className="text-sm text-[var(--avero-danger)]">{error}</p>}
      <Button type="submit" size="lg" disabled={loading || description.trim().length < 3}>
        {loading ? "Starting…" : "Continue →"}
      </Button>
    </form>
  );
}
