/**
 * Persist demo repair records to disk so Home History survives
 * Next.js HMR / in-memory store resets during local demos.
 */
import fs from "fs";
import path from "path";
import type { RepairRecord } from "@/types/db";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "demo-repairs.json");

export function loadPersistedRepairs(): RepairRecord[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw) as RepairRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistRepair(row: RepairRecord): void {
  try {
    const all = loadPersistedRepairs();
    const next = [row, ...all.filter((r) => r.id !== row.id)];
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(next, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist demo repair", err);
  }
}

export function mergePersistedRepairs(existing: RepairRecord[]): RepairRecord[] {
  const ids = new Set(existing.map((r) => r.id));
  const extras = loadPersistedRepairs().filter((r) => !ids.has(r.id));
  if (!extras.length) return existing;
  return [...existing, ...extras];
}
