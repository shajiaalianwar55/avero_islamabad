/**
 * Warranty helpers for Home History (spec §14 / §21).
 */

import type { RepairRecord } from "@/types/db";

export function warrantyRemainingDays(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date()
): number | null {
  if (!expiresAt) return null;
  const end = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function hasActiveWarranty(
  expiresAt: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  const days = warrantyRemainingDays(expiresAt, now);
  return days !== null && days > 0;
}

export function computeWarrantyExpiresAt(
  completedAt: string | Date,
  warrantyDays: number | null | undefined
): string | null {
  if (warrantyDays == null || warrantyDays <= 0) return null;
  const start =
    typeof completedAt === "string" ? new Date(completedAt) : completedAt;
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + warrantyDays);
  return end.toISOString();
}

/** Alias used by unit tests */
export function warrantyExpiresAt(
  completedAt: string | Date,
  warrantyDays: number | null | undefined
): string | null {
  return computeWarrantyExpiresAt(completedAt, warrantyDays);
}

export function findRelevantWarrantyAlert(input: {
  description: string;
  repairs: RepairRecord[];
}): { message: string; repair: RepairRecord; remaining_days: number } | null {
  const text = input.description.toLowerCase();
  const hit = input.repairs.find((r) => {
    if (!hasActiveWarranty(r.warranty_expires_at)) return false;
    const blob = `${r.title} ${r.work_done}`.toLowerCase();
    if (text.includes("ac") && (blob.includes("ac") || blob.includes("cooling"))) {
      return true;
    }
    if (text.includes("sink") && blob.includes("sink")) return true;
    return false;
  });
  if (!hit) return null;
  const remaining = warrantyRemainingDays(hit.warranty_expires_at);
  if (remaining == null || remaining <= 0) return null;
  return {
    message: `This may relate to a repair completed recently. Warranty remaining: ${remaining} days.`,
    repair: hit,
    remaining_days: remaining,
  };
}
