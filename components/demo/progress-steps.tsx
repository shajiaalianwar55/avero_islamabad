"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "report", label: "Report", match: ["/incident/new"] },
  { id: "triage", label: "Questions", match: ["/incident/"] },
  { id: "decision", label: "Decision", match: ["/decision", "/diy"] },
  { id: "offers", label: "Offers", match: ["/providers"] },
  { id: "book", label: "Book", match: ["/booking/"] },
  { id: "history", label: "History", match: ["/history"] },
] as const;

function activeIndex(pathname: string): number {
  if (pathname.includes("/booking/")) return 4;
  if (pathname.includes("/history")) return 5;
  if (pathname.includes("/providers")) return 3;
  if (pathname.includes("/diy") || pathname.includes("/decision")) return 2;
  if (pathname === "/incident/new") return 0;
  if (pathname.startsWith("/incident/")) return 1;
  return 0;
}

export function DemoProgress({ forceStep }: { forceStep?: number }) {
  const pathname = usePathname();
  const current = forceStep ?? activeIndex(pathname);

  return (
    <div className="mb-8 overflow-x-auto">
      <ol className="flex min-w-[520px] items-center gap-1 text-xs sm:text-sm">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-md px-1 py-2 text-center",
                  active && "bg-[var(--avero-teal)]/10 font-semibold text-[var(--avero-teal)]",
                  done && !active && "text-[var(--avero-ink)]",
                  !done && !active && "text-[var(--avero-muted)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                    active && "bg-[var(--avero-teal)] text-white",
                    done && !active && "bg-[var(--avero-sand-deep)] text-[var(--avero-ink)]",
                    !done && !active && "bg-[var(--avero-sand)]"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mb-5 h-px w-2 shrink-0 sm:w-4",
                    i < current ? "bg-[var(--avero-teal)]" : "bg-[var(--avero-line)]"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-[var(--avero-muted)]">
        Demo path: report → answer → decide → offers → book → history
      </p>
      {pathname.includes("/providers") && (
        <p className="mt-1 text-center text-xs">
          <Link href="/provider" className="text-[var(--avero-teal)] underline">
            Optional: open provider portal
          </Link>{" "}
          to submit a live quote
        </p>
      )}
    </div>
  );
}
