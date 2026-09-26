import { env, hasSupabaseConfig } from "@/lib/env";
import * as demo from "@/lib/demo/store";
import type { Offer, Provider, ServiceRequestRow } from "@/types/db";

function shouldUseDemoStore(): boolean {
  if (env.NEXT_PUBLIC_DEMO_MODE) return true;
  if (!hasSupabaseConfig() || !env.SUPABASE_SERVICE_ROLE_KEY) return true;
  return false;
}

async function getAdmin() {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  return createServiceClient();
}

export type ProviderWithCoverage = Provider & { coverage_areas: string[] };

export async function listProviders(opts?: {
  trade?: string;
  area?: string;
}): Promise<ProviderWithCoverage[]> {
  if (shouldUseDemoStore()) return demo.listProviders(opts);

  try {
    const supabase = await getAdmin();
    let query = supabase.from("providers").select("*, provider_coverage(area)");
    if (opts?.trade) query = query.eq("trade", opts.trade);
    const { data, error } = await query;
    if (error) throw error;

    return ((data as Array<Provider & { provider_coverage: { area: string }[] }>) ?? [])
      .map((p) => ({
        ...p,
        coverage_areas: (p.provider_coverage ?? []).map((c) => c.area),
      }))
      .filter((p) => (opts?.area ? p.coverage_areas.includes(opts.area) : true));
  } catch {
    return demo.listProviders(opts);
  }
}

export async function getProvider(id: string): Promise<Provider | null> {
  if (shouldUseDemoStore()) return demo.getProvider(id) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Provider) ?? null;
  } catch {
    return demo.getProvider(id) ?? null;
  }
}

export async function listOpenRequests(): Promise<ServiceRequestRow[]> {
  if (shouldUseDemoStore()) return demo.listOpenServiceRequests();

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .in("status", ["OPEN", "OFFERS_RECEIVED"])
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ServiceRequestRow[]) ?? [];
  } catch {
    return demo.listOpenServiceRequests();
  }
}

export async function createOffer(
  input: Omit<Offer, "id" | "created_at" | "status" | "is_demo"> & {
    status?: Offer["status"];
    is_demo?: boolean;
  }
): Promise<Offer> {
  if (shouldUseDemoStore()) return demo.createOffer(input);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("offers")
      .insert({
        ...input,
        status: input.status ?? "PENDING",
        is_demo: input.is_demo ?? false,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase
      .from("service_requests")
      .update({ status: "OFFERS_RECEIVED" })
      .eq("id", input.service_request_id)
      .eq("status", "OPEN");

    return data as Offer;
  } catch {
    return demo.createOffer(input);
  }
}

export async function listOffers(serviceRequestId: string): Promise<Offer[]> {
  if (shouldUseDemoStore()) return demo.listOffers(serviceRequestId);

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("service_request_id", serviceRequestId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as Offer[]) ?? [];
  } catch {
    return demo.listOffers(serviceRequestId);
  }
}

export async function getOffer(id: string): Promise<Offer | null> {
  if (shouldUseDemoStore()) return demo.getOffer(id) ?? null;

  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Offer) ?? null;
  } catch {
    return demo.getOffer(id) ?? null;
  }
}

export async function loadDemoOffers(serviceRequestId: string): Promise<Offer[]> {
  if (shouldUseDemoStore()) return demo.loadDemoOffers(serviceRequestId);

  // Even with Supabase, demo offers are generated in-memory then inserted
  const generated = demo.loadDemoOffers(serviceRequestId);
  try {
    const supabase = await getAdmin();
    for (const offer of generated.filter((o) => o.is_demo)) {
      await supabase.from("offers").upsert({
        id: offer.id,
        service_request_id: offer.service_request_id,
        provider_id: offer.provider_id,
        visit_fee: offer.visit_fee,
        estimated_total_min: offer.estimated_total_min,
        estimated_total_max: offer.estimated_total_max,
        earliest_arrival: offer.earliest_arrival,
        warranty_days: offer.warranty_days,
        parts_included: offer.parts_included,
        notes: offer.notes,
        status: offer.status,
        is_demo: true,
      });
    }
    await supabase
      .from("service_requests")
      .update({ status: "OFFERS_RECEIVED" })
      .eq("id", serviceRequestId);
  } catch {
    // keep demo store results
  }
  return generated;
}
