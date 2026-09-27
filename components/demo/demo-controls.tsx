"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Lightweight shortcut — primary flow starts from Report a problem. */
export function DemoControls() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link href="/incident/new">
        <Button size="sm">Report a problem</Button>
      </Link>
    </div>
  );
}
