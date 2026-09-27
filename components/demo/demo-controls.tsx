"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoScenarioCards } from "@/components/demo/demo-scenario-cards";

/** Compact floating helper — primary demos live on the homepage. */
export function DemoControls() {
  const [open, setOpen] = useState(false);

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 max-h-[70vh] w-[min(100vw-2rem,22rem)] overflow-y-auto rounded-lg border border-[var(--avero-line)] bg-[var(--avero-panel)] p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--avero-muted)]">
            Quick demos
          </p>
          <DemoScenarioCards compact />
        </div>
      )}
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Demos"}
      </Button>
    </div>
  );
}
