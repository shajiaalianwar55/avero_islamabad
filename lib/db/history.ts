import { shouldUseDemoBackend } from "@/lib/env";
import * as demo from "@/lib/demo/store";
import type { Home, HomeAsset, RepairRecord } from "@/types/db";
import {
  hasActiveWarranty,
  warrantyRemainingDays,
} from "@/lib/history/warranty";

function shouldUseDemoStore(): boolean {
  return shouldUseDemoBackend();
}

async function getAdmin() {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  return createServiceClient();
}

function failSupabase(error: unknown): never {
  console.error("Supabase history operation failed", error);
  throw error;
}

export type HistoryItem = RepairRecord & {
  warranty_remaining_days: number | null;
  warranty_active: boolean;
  asset?: HomeAsset | null;
};

export async function getHome(
  homeId: string = demo.DEMO_HOME_ID
): Promise<Home | null> {
  if (shouldUseDemoStore()) return demo.getHome(homeId) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("homes")
      .select("*")
      .eq("id", homeId)
      .maybeSingle();
    if (error) throw error;
    return (data as Home) ?? null;
  } catch (error) {
    return failSupabase(error);
  }
}

export async function listHomeAssets(
  homeId: string = demo.DEMO_HOME_ID
): Promise<HomeAsset[]> {
  if (shouldUseDemoStore()) return demo.getHomeAssets(homeId);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("home_assets")
      .select("*")
      .eq("home_id", homeId);
    if (error) throw error;
    return (data as HomeAsset[]) ?? [];
  } catch (error) {
    return failSupabase(error);
  }
}

export async function listRepairHistory(
  homeId: string = demo.DEMO_HOME_ID
): Promise<HistoryItem[]> {
  let records: RepairRecord[];
  let assets: HomeAsset[];

  if (shouldUseDemoStore()) {
    records = demo.listRepairHistory(homeId);
    assets = demo.getHomeAssets(homeId);
  } else {
    try {
      const supabase = await getAdmin();
      const { data, error } = await supabase
        .from("repair_records")
        .select("*")
        .eq("home_id", homeId)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      records = (data as RepairRecord[]) ?? [];
      const { data: assetData } = await supabase
        .from("home_assets")
        .select("*")
        .eq("home_id", homeId);
      assets = (assetData as HomeAsset[]) ?? [];
    } catch (error) {
      return failSupabase(error);
    }
  }

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return records.map((r) => ({
    ...r,
    warranty_remaining_days: warrantyRemainingDays(r.warranty_expires_at),
    warranty_active: hasActiveWarranty(r.warranty_expires_at),
    asset: r.asset_id ? assetMap.get(r.asset_id) ?? null : null,
    category:
      (r.asset_id ? assetMap.get(r.asset_id)?.asset_type : null) ||
      (/ac|cooling/i.test(r.title) ? "ac" : null) ||
      (/sink|plumb|pipe|faucet/i.test(r.title) ? "plumbing" : null) ||
      (/electric|socket|wiring/i.test(r.title) ? "electrical" : null) ||
      (/diy/i.test(r.title) || r.provider_name === "Self (DIY)" ? "diy" : null) ||
      undefined,
  }));
}

export async function findRelevantHistory(input: {
  homeId?: string;
  category?: string | null;
  description?: string;
}): Promise<HistoryItem[]> {
  const history = await listRepairHistory(input.homeId ?? demo.DEMO_HOME_ID);
  const text = `${input.category ?? ""} ${input.description ?? ""}`.toLowerCase();

  return history.filter((r) => {
    const assetType = r.asset?.asset_type?.toLowerCase() ?? "";
    const title = r.title.toLowerCase();
    if (input.category && (assetType === input.category || title.includes(input.category))) {
      return true;
    }
    if (text.includes("ac") && (assetType === "ac" || title.includes("ac"))) {
      return true;
    }
    if (text.includes("sink") && title.includes("sink")) return true;
    return false;
  });
}
