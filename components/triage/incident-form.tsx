"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageAttach } from "@/components/triage/image-attach";
import { VoiceInput } from "@/components/triage/voice-input";
import { ISLAMABAD_AREAS, SERVICE_CATEGORIES } from "@/types";

export function IncidentForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("F-10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-2">
        <Label htmlFor="area">Home / area</Label>
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
        <Label>Local categories</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map((cat) => (
            <span
              key={cat.id}
              className="rounded-md border border-[var(--avero-line)] px-2 py-1 text-xs"
            >
              {cat.label}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">What is wrong?</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: There is water under my kitchen sink."
          required
        />
        <VoiceInput
          onText={(t) =>
            setDescription((prev) => {
              const next = t.trim();
              if (!next) return prev;
              if (!prev.trim()) return next;
              // Append once if user already typed something; avoid re-stacking the same phrase
              if (prev.includes(next)) return prev;
              return `${prev.trim()} ${next}`;
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Photo (optional)</Label>
        <ImageAttach />
      </div>
      {error && <p className="text-sm text-[var(--avero-danger)]">{error}</p>}
      <Button type="submit" disabled={loading || description.trim().length < 3}>
        {loading ? "Starting triage…" : "Start triage"}
      </Button>
    </form>
  );
}
