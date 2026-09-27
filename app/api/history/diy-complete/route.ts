import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { createIncident, updateIncidentStatus } from "@/lib/db/incidents";
import { createRepairRecord } from "@/lib/db/bookings";
import { DEMO_AC_ASSET_ID, DEMO_HOME_ID, DEMO_SINK_ASSET_ID } from "@/lib/demo/store";
import { computeWarrantyExpiresAt } from "@/lib/history/warranty";

const bodySchema = z.object({
  description: z.string().min(1),
  area: z.string().optional(),
  appliance_name: z.string().optional(),
  appliance_id: z.string().optional(),
  category: z.string().optional(),
  work_done: z.string().optional(),
});

function assetForAppliance(applianceId?: string, category?: string): string | null {
  if (applianceId === "bedroom-ac" || category === "ac") return DEMO_AC_ASSET_ID;
  if (applianceId === "kitchen-sink" || category === "plumbing") return DEMO_SINK_ASSET_ID;
  return null;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail("INVALID_JSON", "Request body must be JSON");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body");
  }

  try {
    const applianceLabel = parsed.data.appliance_name || "Home appliance";
    const category =
      parsed.data.category ||
      (parsed.data.appliance_id === "bedroom-ac"
        ? "ac"
        : parsed.data.appliance_id === "kitchen-sink"
          ? "plumbing"
          : parsed.data.appliance_id === "wall-socket" ||
              parsed.data.appliance_id === "ups"
            ? "electrical"
            : "appliance");

    const incident = await createIncident({
      home_id: DEMO_HOME_ID,
      asset_id: assetForAppliance(parsed.data.appliance_id, category),
      initial_description: parsed.data.description,
      category_guess: category,
      status: "RESOLVED",
    });

    await updateIncidentStatus(incident.id, "RESOLVED");

    const completedAt = new Date().toISOString();
    const repair = await createRepairRecord({
      home_id: DEMO_HOME_ID,
      asset_id: incident.asset_id,
      incident_id: incident.id,
      booking_id: null,
      title: `${applianceLabel} — DIY fix`,
      work_done:
        parsed.data.work_done ||
        "Resolved with Avero guided DIY steps. User confirmed the issue is fixed.",
      parts_replaced: [],
      amount_paid: null,
      provider_name: "Self (DIY)",
      completed_at: completedAt,
      warranty_days: null,
      warranty_expires_at: computeWarrantyExpiresAt(completedAt, null),
      before_images: [],
      after_images: [],
      notes: `DIY path · ${parsed.data.area || "Islamabad"}`,
    });

    return ok({ incident, repair }, 201);
  } catch (err) {
    console.error(err);
    return fail("DIY_HISTORY_FAILED", "Could not save DIY fix to history", 500);
  }
}
