import { shouldUseDemoBackend } from "@/lib/env";
import * as demo from "@/lib/demo/store";
import type { Offer, Provider, ServiceRequestRow } from "@/types/db";

function shouldUseDemoStore(): boolean {
  return shouldUseDemoBackend();
}

async function getAdmin() {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  return createServiceClient();
}

function failSupabase(error: unknown): never {
  console.error("Supabase provider operation failed", error);
  throw error;
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
  } catch (error) {
    return failSupabase(error);
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
  } catch (error) {
    return failSupabase(error);
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
  } catch (error) {
    return failSupabase(error);
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
  } catch (error) {
    return failSupabase(error);
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
  } catch (error) {
    return failSupabase(error);
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
  } catch (error) {
    return failSupabase(error);
  }
}

export async function loadDemoOffers(serviceRequestId: string): Promise<Offer[]> {
  if (shouldUseDemoStore()) return demo.loadDemoOffers(serviceRequestId);

  try {
    const supabase = await getAdmin();
    const { data: request, error: requestError } = await supabase
      .from("service_requests")
      .select("category, area")
      .eq("id", serviceRequestId)
      .single();
    if (requestError) throw requestError;

    const existing = await listOffers(serviceRequestId);
    if (existing.length >= 2) return existing;

    const providers = await listProviders({
      trade: request.category,
      area: request.area,
    });
    const usedProviderIds = new Set(existing.map((offer) => offer.provider_id));
    const templates = [
      {
        visit_fee: 800,
        estimated_total_min: 2500,
        estimated_total_max: 4500,
        warranty_days: 30,
        parts_included: "no" as const,
        hours: 2,
        notes: "Demo offer — standard visit + diagnosis",
      },
      {
        visit_fee: 500,
        estimated_total_min: 2000,
        estimated_total_max: 3500,
        warranty_days: 14,
        parts_included: "unclear" as const,
        hours: 1,
        notes: "Demo offer — earliest arrival, lower warranty",
      },
    ];

    const created: Offer[] = [];
    for (const provider of providers) {
      if (usedProviderIds.has(provider.id)) continue;
      const template = templates[created.length % templates.length]!;
      const arrival = new Date(Date.now() + template.hours * 60 * 60 * 1000);
      created.push(
        await createOffer({
          service_request_id: serviceRequestId,
          provider_id: provider.id,
          visit_fee: template.visit_fee,
          estimated_total_min: template.estimated_total_min,
          estimated_total_max: template.estimated_total_max,
          earliest_arrival: arrival.toISOString(),
          warranty_days: template.warranty_days,
          parts_included: template.parts_included,
          notes: template.notes,
          is_demo: true,
        })
      );
      if (existing.length + created.length >= 2) break;
    }

    return [...existing, ...created];
  } catch (error) {
    return failSupabase(error);
  }
}
