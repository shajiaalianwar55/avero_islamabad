"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Optional image attach — failure never blocks text triage.
 */
export function ImageAttach({
  incidentId,
  onUploaded,
}: {
  incidentId?: string;
  onUploaded?: (url: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      if (incidentId) body.append("incident_id", incidentId);
      const res = await fetch("/api/incidents/image", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message || "Image upload failed — continue with text.");
        return;
      }
      setUrl(json.data.url);
      onUploaded?.(json.data.url);
    } catch {
      setError("Image upload failed — continue with text.");
    }
  }

  return (
    <div className="space-y-2">
      <Input type="file" accept="image/*" onChange={onChange} />
      {url && <p className="text-xs text-[var(--avero-teal)]">Attached: {url}</p>}
      {error && <p className="text-xs text-[var(--avero-alert)]">{error}</p>}
      <Button type="button" size="sm" variant="ghost" disabled>
        Image is optional
      </Button>
    </div>
  );
}
