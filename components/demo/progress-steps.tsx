"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ProgressBranch = "none" | "DIY" | "TECHNICIAN" | "EMERGENCY";

export type ProgressStepId =
  | "report"
  | "appliance"
  | "problem"
  | "diagnose"
  | "decision"
  | "emergency"
  | "diy"
  | "book"
  | "history";

type StepDef = { id: ProgressStepId; label: string };

const SHARED: StepDef[] = [
  { id: "report", label: "Report" },
  { id: "appliance", label: "Appliance" },
  { id: "problem", label: "Problem" },
  { id: "diagnose", label: "Diagnose" },
  { id: "decision", label: "Decision" },
];

/** Journey steps for the user's actual path — not every app state. */
export function stepsForBranch(branch: ProgressBranch): StepDef[] {
  switch (branch) {
    case "EMERGENCY":
      return [
        { id: "report", label: "Report" },
        { id: "appliance", label: "Appliance" },
        { id: "problem", label: "Problem" },
        { id: "emergency", label: "Emergency" },
      ];
    case "DIY":
      return [
        ...SHARED,
        { id: "diy", label: "Guided Fix" },
        { id: "history", label: "History" },
      ];
    case "TECHNICIAN":
      return [
        ...SHARED,
        { id: "book", label: "Book" },
        { id: "history", label: "History" },
      ];
    default:
      return SHARED;
  }
}

function inferFromPath(pathname: string): {
  current: ProgressStepId;
  branch: ProgressBranch;
} {
  if (pathname.includes("/history")) {
    return { current: "history", branch: "DIY" };
  }
  if (pathname.includes("/booking/") || pathname.includes("/providers")) {
    return { current: "book", branch: "TECHNICIAN" };
  }
  if (pathname.includes("/diy")) {
    return { current: "diy", branch: "DIY" };
  }
  if (pathname.includes("/decision")) {
    return { current: "decision", branch: "none" };
  }
  if (pathname === "/incident/new") {
    return { current: "report", branch: "none" };
  }
  if (pathname.startsWith("/incident/")) {
    return { current: "diagnose", branch: "none" };
  }
  return { current: "report", branch: "none" };
}

/**
 * @deprecated Prefer `current` + `branch`. Maps old numeric indices for leftover call sites.
 */
function legacyForceStep(
  forceStep: number,
  branch: ProgressBranch
): ProgressStepId {
  const steps = stepsForBranch(branch);
  const clamped = Math.max(0, Math.min(forceStep, steps.length - 1));
  return steps[clamped]?.id ?? "report";
}

export function DemoProgress({
  current,
  branch = "none",
  forceStep,
}: {
  /** Active step in the current journey */
  current?: ProgressStepId;
  /** Post-decision path — omit or "none" until outcome is known */
  branch?: ProgressBranch;
  /** @deprecated use current + branch */
  forceStep?: number;
}) {
  const pathname = usePathname();
  const inferred = inferFromPath(pathname);

  const resolvedBranch = branch !== "none" ? branch : inferred.branch;
  let resolvedCurrent: ProgressStepId =
    current ??
    (typeof forceStep === "number"
      ? legacyForceStep(forceStep, resolvedBranch === "none" ? "none" : resolvedBranch)
      : inferred.current);

  // Emergency journey: decision screen is the Emergency terminal step
  if (resolvedBranch === "EMERGENCY" && resolvedCurrent === "decision") {
    resolvedCurrent = "emergency";
  }

  const steps = stepsForBranch(resolvedBranch);
  let activeIdx = steps.findIndex((s) => s.id === resolvedCurrent);
  if (activeIdx < 0) {
    // Fallback: map decision→emergency already handled; map action aliases
    if (resolvedCurrent === "decision" && resolvedBranch === "EMERGENCY") {
      activeIdx = steps.findIndex((s) => s.id === "emergency");
    } else {
      activeIdx = Math.max(0, steps.length - 1);
    }
  }

  return (
    <div className="mb-8 overflow-x-auto">
      <ol
        className="flex items-center gap-1 text-xs sm:text-sm"
        style={{ minWidth: `${Math.max(steps.length * 88, 320)}px` }}
      >
        {steps.map((step, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          const isEmergencyActive =
            active && step.id === "emergency";
          return (
            <li key={step.id} className="flex flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-md px-1 py-2 text-center",
                  active &&
                    !isEmergencyActive &&
                    "bg-[var(--avero-teal)]/10 font-semibold text-[var(--avero-teal)]",
                  isEmergencyActive &&
                    "bg-[var(--avero-danger)]/10 font-semibold text-[var(--avero-danger)]",
                  done && !active && "text-[var(--avero-ink)]",
                  !done && !active && "text-[var(--avero-muted)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                    active &&
                      !isEmergencyActive &&
                      "bg-[var(--avero-teal)] text-white",
                    isEmergencyActive && "bg-[var(--avero-danger)] text-white",
                    done && !active && "bg-[var(--avero-sand-deep)] text-[var(--avero-ink)]",
                    !done && !active && "bg-[var(--avero-sand)]"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mb-5 h-px w-2 shrink-0 sm:w-4",
                    i < activeIdx ? "bg-[var(--avero-teal)]" : "bg-[var(--avero-line)]"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      {pathname.includes("/providers") && (
        <p className="mt-2 text-center text-xs">
          <Link href="/provider" className="text-[var(--avero-teal)] underline">
            Optional: provider portal
          </Link>{" "}
          for a live quote
        </p>
      )}
    </div>
  );
}
