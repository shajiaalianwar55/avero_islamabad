"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmergencyCopy } from "@/lib/diagnostics/emergency-copy";

type DetailRow = { label: string; value: string };

export function EmergencyDecisionPanel({
  copy,
  details,
  primaryBusy,
  onPrimary,
  primaryLabel = "Get emergency help",
}: {
  copy: EmergencyCopy;
  details?: DetailRow[];
  primaryBusy?: boolean;
  onPrimary?: () => void;
  primaryLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-[var(--avero-danger)] bg-[var(--avero-panel)] p-5 md:p-6">
        <Badge variant="danger">Emergency</Badge>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--avero-ink)] md:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-2 text-base text-[var(--avero-ink)]">{copy.explanation}</p>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--avero-danger)]">
            Do this now
          </p>
          <ul className="mt-2 space-y-2 text-base text-[var(--avero-ink)]">
            {copy.doNow.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--avero-danger)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--avero-muted)]">
            Do not
          </p>
          <ul className="mt-2 space-y-2 text-base text-[var(--avero-muted)]">
            {copy.doNot.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--avero-line)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href="tel:1122">
            <Button size="lg" variant="danger" disabled={primaryBusy}>
              Get emergency help (1122)
            </Button>
          </a>
          {onPrimary && (
            <Button size="lg" variant="secondary" disabled={primaryBusy} onClick={onPrimary}>
              {primaryBusy ? "Saving…" : primaryLabel}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-[var(--avero-muted)]">
          Avero is not a substitute for emergency services.
        </p>
      </div>

      <div className="space-y-2 px-1">
        <p className="text-sm text-[var(--avero-muted)]">
          <span className="font-medium text-[var(--avero-ink)]">Why Avero flagged this</span>
          <br />
          {copy.whyFlagged}
        </p>

        {details && details.length > 0 && (
          <div>
            <button
              type="button"
              className="text-sm font-medium text-[var(--avero-teal)] underline-offset-2 hover:underline"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? "Hide diagnosis details" : "View diagnosis details"}
            </button>
            {open && (
              <Card className="mt-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Diagnosis details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[var(--avero-muted)]">
                  {details.map((d) => (
                    <div key={d.label}>
                      <p className="font-medium text-[var(--avero-ink)]">{d.label}</p>
                      <p>{d.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
