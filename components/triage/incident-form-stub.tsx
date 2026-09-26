"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ISLAMABAD_AREAS } from "@/types";

export function IncidentFormStub() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("F-10");

  return (
    <form
      className="space-y-6 rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        // Phase 2 wires persistence; skeleton routes to a placeholder id.
        router.push(`/incident/demo?area=${encodeURIComponent(area)}&q=${encodeURIComponent(description)}`);
      }}
    >
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
        <Label htmlFor="description">What is happening?</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="There is water under my kitchen sink."
          required
        />
      </div>
      <p className="text-sm text-[var(--avero-muted)]">
        Voice and photo are optional and will be wired in later phases. Text always works.
      </p>
      <Button type="submit">Start triage</Button>
    </form>
  );
}
