import { env, hasSupabaseConfig } from "@/lib/env";
import * as demo from "@/lib/demo/store";
import type { Home, HomeAsset, RepairRecord } from "@/types/db";
import {
  hasActiveWarranty,
  warrantyRemainingDays,
} from "@/lib/history/warranty";

function shouldUseDemoStore(): boolean {
  if (env.NEXT_PUBLIC_DEMO_MODE) return true;
  if (!hasSupabaseConfig() || !env.SUPABASE_SERVICE_ROLE_KEY) return true;
  return false;
}

async function getAdmin() {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  return createServiceClient();
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
  } catch {
    return demo.getHome(homeId) ?? null;
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
  } catch {
    return demo.getHomeAssets(homeId);
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
    } catch {
      records = demo.listRepairHistory(homeId);
      assets = demo.getHomeAssets(homeId);
    }
  }

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return records.map((r) => ({
    ...r,
    warranty_remaining_days: warrantyRemainingDays(r.warranty_expires_at),
    warranty_active: hasActiveWarranty(r.warranty_expires_at),
    asset: r.asset_id ? assetMap.get(r.asset_id) ?? null : null,
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
