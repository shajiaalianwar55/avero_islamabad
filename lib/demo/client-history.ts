/**
 * Browser-side Home History — survives serverless cold starts / demo store wipes.
 * Merged with /api/history on the History page.
 */
export type LocalRepair = {
  id: string;
  title: string;
  work_done: string;
  provider_name?: string | null;
  amount_paid?: number | null;
  completed_at: string;
  warranty_days?: number | null;
  warranty_remaining_days?: number | null;
  category?: string;
};

const KEY = "avero_home_history_v1";

export function readLocalRepairs(): LocalRepair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalRepair[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberRepair(repair: LocalRepair): void {
  if (typeof window === "undefined" || !repair?.id) return;
  const next = [
    repair,
    ...readLocalRepairs().filter((r) => r.id !== repair.id),
  ].slice(0, 40);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function mergeRepairs(
  server: LocalRepair[],
  local: LocalRepair[]
): LocalRepair[] {
  const map = new Map<string, LocalRepair>();
  for (const r of [...server, ...local]) {
    if (!r?.id) continue;
    const prev = map.get(r.id);
    if (!prev || (r.completed_at || "") > (prev.completed_at || "")) {
      map.set(r.id, { ...prev, ...r });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.completed_at || "").localeCompare(a.completed_at || "")
  );
}

export function repairFromApi(row: Record<string, unknown>): LocalRepair {
  return {
    id: String(row.id),
    title: String(row.title || "Repair"),
    work_done: String(row.work_done || ""),
    provider_name: (row.provider_name as string | null) ?? null,
    amount_paid:
      row.amount_paid == null ? null : Number(row.amount_paid),
    completed_at: String(row.completed_at || new Date().toISOString()),
    warranty_days:
      row.warranty_days == null ? null : Number(row.warranty_days),
    warranty_remaining_days:
      row.warranty_remaining_days == null
        ? null
        : Number(row.warranty_remaining_days),
    category: row.category ? String(row.category) : undefined,
  };
}

const BOOKING_KEY = "avero_last_booking_v1";

export type LocalBooking = {
  id: string;
  provider_name?: string | null;
  amount?: number | null;
  visit_fee?: number | null;
  warranty_days?: number | null;
  status?: string;
  scheduled_for?: string;
};

export function rememberBooking(booking: LocalBooking): void {
  if (typeof window === "undefined" || !booking?.id) return;
  try {
    window.localStorage.setItem(BOOKING_KEY, JSON.stringify(booking));
  } catch {
    /* ignore */
  }
}

export function readLastBooking(): LocalBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BOOKING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalBooking;
  } catch {
    return null;
  }
}
