import { ok, fail } from "@/lib/api";
import { getServiceRequest } from "@/lib/db/incidents";
import { getProvider, listOffers } from "@/lib/db/providers";
import { rankOffers } from "@/lib/scoring/offers";
import { normalizeOffer } from "@/lib/ai/offer-normalizer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const serviceRequest = await getServiceRequest(id);
  if (!serviceRequest) {
    return fail("NOT_FOUND", "Service request not found", 404);
  }

  try {
    const offers = await listOffers(id);
    const { listProviders } = await import("@/lib/db/providers");
    type ScoredInput = {
      offer: (typeof offers)[number];
      provider: NonNullable<Awaited<ReturnType<typeof getProvider>>>;
      requestCategory: string;
      requestArea: string;
      providerAreas: string[];
      normalized: Awaited<ReturnType<typeof normalizeOffer>>;
    };
    const scoredInputs: ScoredInput[] = [];

    for (const offer of offers) {
      const provider = await getProvider(offer.provider_id);
      if (!provider) continue;
      const normalized = await normalizeOffer({
        provider_id: offer.provider_id,
        service_request_id: offer.service_request_id,
        visit_fee: offer.visit_fee,
        estimated_total_min: offer.estimated_total_min,
        estimated_total_max: offer.estimated_total_max,
        earliest_arrival: offer.earliest_arrival,
        warranty_days: offer.warranty_days,
        parts_included: offer.parts_included,
        notes: offer.notes,
      });

      const withCoverage = await listProviders({ trade: provider.trade });
      const match = withCoverage.find((p) => p.id === provider.id);

      scoredInputs.push({
        offer,
        provider,
        requestCategory: serviceRequest.category,
        requestArea: serviceRequest.area,
        providerAreas: match?.coverage_areas ?? [],
        normalized,
      });
    }

    const ranked = rankOffers(
      scoredInputs.map(({ offer, provider, requestCategory, requestArea, providerAreas }) => ({
        offer,
        provider,
        requestCategory,
        requestArea,
        providerAreas,
      }))
    ).map((s) => {
      const extra = scoredInputs.find((i) => i.offer.id === s.offer.id);
      return {
        ...s,
        normalized: extra?.normalized,
      };
    });

    return ok({
      serviceRequest,
      offers: ranked,
      count: ranked.length,
    });
  } catch (err) {
    console.error(err);
    return fail("OFFERS_FAILED", "Could not load offers", 500);
  }
}
