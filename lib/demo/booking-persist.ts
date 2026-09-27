/**
 * Persist demo bookings so /booking/[id] survives HMR / serverless resets.
 */
import fs from "fs";
import path from "path";
import type { Booking, Payment } from "@/types/db";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "demo-bookings.json");

type Snapshot = {
  bookings: Booking[];
  payments: Payment[];
};

function readAll(): Snapshot {
  try {
    if (!fs.existsSync(FILE)) return { bookings: [], payments: [] };
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as Snapshot;
    return {
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    };
  } catch {
    return { bookings: [], payments: [] };
  }
}

function writeAll(data: Snapshot) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

export function persistBookingPair(booking: Booking, payment: Payment): void {
  try {
    const all = readAll();
    all.bookings = [booking, ...all.bookings.filter((b) => b.id !== booking.id)];
    all.payments = [
      payment,
      ...all.payments.filter((p) => p.booking_id !== payment.booking_id),
    ];
    writeAll(all);
  } catch (err) {
    console.error("Failed to persist demo booking", err);
  }
}

export function loadPersistedBooking(
  id: string
): { booking: Booking; payment?: Payment } | null {
  const all = readAll();
  const booking = all.bookings.find((b) => b.id === id);
  if (!booking) return null;
  const payment = all.payments.find((p) => p.booking_id === id);
  return { booking, payment };
}

export function mergePersistedBookings(
  bookings: Booking[],
  payments: Payment[]
): { bookings: Booking[]; payments: Payment[] } {
  const all = readAll();
  const bIds = new Set(bookings.map((b) => b.id));
  const pIds = new Set(payments.map((p) => p.id));
  return {
    bookings: [...bookings, ...all.bookings.filter((b) => !bIds.has(b.id))],
    payments: [...payments, ...all.payments.filter((p) => !pIds.has(p.id))],
  };
}
