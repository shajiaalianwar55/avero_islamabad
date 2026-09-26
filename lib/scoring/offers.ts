import type { Offer, Provider } from "@/types/db";

export type OfferScoreInput = {
  offer: Offer;
  provider: Provider;
  requestCategory: string;
  requestArea: string;
  providerAreas: string[];
};

export type ScoredOffer = OfferScoreInput & {
  score: number;
  breakdown: {
    skillMatch: number;
    ratingScore: number;
    availabilityScore: number;
    priceScore: number;
    warrantyScore: number;
    distanceScore: number;
  };
  badges: Array<"Recommended" | "Cheapest" | "Earliest" | "Longest warranty">;
};

/**
 * Deterministic offer scoring (spec §7.9).
 * score =
 *   skillMatch * 0.25 +
 *   ratingScore * 0.20 +
 *   availabilityScore * 0.20 +
 *   priceScore * 0.15 +
 *   warrantyScore * 0.10 +
 *   distanceScore * 0.10;
 */
export function scoreOffer(input: OfferScoreInput): ScoredOffer {
  const { offer, provider, requestCategory, requestArea, providerAreas } =
    input;

  const skillMatch =
    provider.trade === requestCategory
      ? 1
      : relatedTrade(provider.trade, requestCategory)
        ? 0.7
        : 0.2;

  const ratingScore = Math.min(Math.max(provider.rating / 5, 0), 1);

  const availabilityScore = availabilityFromArrival(offer.earliest_arrival);

  const midPrice =
    offer.estimated_total_min != null && offer.estimated_total_max != null
      ? (offer.estimated_total_min + offer.estimated_total_max) / 2
      : offer.visit_fee ?? null;
  // Lower price -> higher score; normalize against typical Islamabad range ~1k–8k
  const priceScore =
    midPrice == null
      ? 0.5
      : Math.min(Math.max(1 - midPrice / 8000, 0), 1);

  const warrantyScore =
    offer.warranty_days == null
      ? 0.3
      : Math.min(offer.warranty_days / 90, 1);

  const distanceScore = providerAreas.includes(requestArea)
    ? 1
    : providerAreas.length > 0
      ? 0.4
      : 0.2;

  const breakdown = {
    skillMatch,
    ratingScore,
    availabilityScore,
    priceScore,
    warrantyScore,
    distanceScore,
  };

  const score =
    skillMatch * 0.25 +
    ratingScore * 0.2 +
    availabilityScore * 0.2 +
    priceScore * 0.15 +
    warrantyScore * 0.1 +
    distanceScore * 0.1;

  return {
    ...input,
    score: Math.round(score * 1000) / 1000,
    breakdown,
    badges: [],
  };
}

function relatedTrade(providerTrade: string, category: string): boolean {
  const pairs: Record<string, string[]> = {
    water_pump: ["geyser"],
    geyser: ["water_pump"],
    ups_inverter: ["electrical", "solar"],
    solar: ["electrical", "ups_inverter"],
  };
  return pairs[providerTrade]?.includes(category) ?? false;
}

function availabilityFromArrival(earliest: string | null): number {
  if (!earliest) return 0.4;
  const ms = new Date(earliest).getTime() - Date.now();
  if (Number.isNaN(ms)) return 0.4;
  const hours = ms / (1000 * 60 * 60);
  if (hours <= 2) return 1;
  if (hours <= 6) return 0.85;
  if (hours <= 24) return 0.65;
  if (hours <= 48) return 0.45;
  return 0.25;
}

export function rankOffers(inputs: OfferScoreInput[]): ScoredOffer[] {
  const scored = inputs.map(scoreOffer).sort((a, b) => b.score - a.score);

  if (scored.length === 0) return scored;

  const recommended = scored[0]!;
  recommended.badges.push("Recommended");

  const cheapest = [...scored].sort((a, b) => {
    const pa =
      a.offer.estimated_total_min ?? a.offer.visit_fee ?? Number.POSITIVE_INFINITY;
    const pb =
      b.offer.estimated_total_min ?? b.offer.visit_fee ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  })[0];
  if (cheapest && !cheapest.badges.includes("Cheapest")) {
    cheapest.badges.push("Cheapest");
  }

  const earliest = [...scored].sort((a, b) => {
    const ta = a.offer.earliest_arrival
      ? new Date(a.offer.earliest_arrival).getTime()
      : Number.POSITIVE_INFINITY;
    const tb = b.offer.earliest_arrival
      ? new Date(b.offer.earliest_arrival).getTime()
      : Number.POSITIVE_INFINITY;
    return ta - tb;
  })[0];
  if (earliest && !earliest.badges.includes("Earliest")) {
    earliest.badges.push("Earliest");
  }

  const longest = [...scored].sort(
    (a, b) => (b.offer.warranty_days ?? 0) - (a.offer.warranty_days ?? 0)
  )[0];
  if (
    longest &&
    (longest.offer.warranty_days ?? 0) > 0 &&
    !longest.badges.includes("Longest warranty")
  ) {
    longest.badges.push("Longest warranty");
  }

  return scored;
}

/** Test/helper adapter for a simplified offer list shape */
export function scoreOffers(
  items: Array<{
    id: string;
    provider_id: string;
    estimated_total_min?: number | null;
    estimated_total_max?: number | null;
    earliest_arrival?: string | null;
    warranty_days?: number | null;
    visit_fee?: number | null;
    provider: { rating: number; trade: string; areas: string[] };
    requestedTrade: string;
    requestedArea: string;
  }>
) {
  return rankOffers(
    items.map((item) => ({
      offer: {
        id: item.id,
        service_request_id: "sr",
        provider_id: item.provider_id,
        visit_fee: item.visit_fee ?? null,
        estimated_total_min: item.estimated_total_min ?? null,
        estimated_total_max:
          item.estimated_total_max ?? item.estimated_total_min ?? null,
        earliest_arrival: item.earliest_arrival ?? null,
        warranty_days: item.warranty_days ?? null,
        parts_included: "unclear" as const,
        notes: null,
        status: "PENDING" as const,
        is_demo: true,
        created_at: new Date().toISOString(),
      },
      provider: {
        id: item.provider_id,
        name: item.provider_id,
        trade: item.provider.trade,
        rating: item.provider.rating,
        completed_jobs: 0,
        verified: true,
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
      requestCategory: item.requestedTrade,
      requestArea: item.requestedArea,
      providerAreas: item.provider.areas,
    }))
  );
}
