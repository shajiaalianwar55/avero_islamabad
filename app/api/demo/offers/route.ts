import { z } from "zod";
import { ok, fail } from "@/lib/api";
import { loadDemoOffers, listOffers, getProvider } from "@/lib/db/providers";
import { getServiceRequest } from "@/lib/db/incidents";
import { rankOffers } from "@/lib/scoring/offers";
import { listProviders } from "@/lib/db/providers";

const bodySchema = z.object({
  service_request_id: z.string().uuid(),
});

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

  const serviceRequest = await getServiceRequest(parsed.data.service_request_id);
  if (!serviceRequest) {
    return fail("NOT_FOUND", "Service request not found", 404);
  }

  try {
    await loadDemoOffers(parsed.data.service_request_id);
    const offers = await listOffers(parsed.data.service_request_id);
    const providers = await listProviders({
      trade: serviceRequest.category,
      area: serviceRequest.area,
    });

    const ranked = rankOffers(
      (
        await Promise.all(
          offers.map(async (offer) => {
            const provider =
              (await getProvider(offer.provider_id)) ??
              providers.find((p) => p.id === offer.provider_id);
            if (!provider) return null;
            const match = providers.find((p) => p.id === provider.id);
            return {
              offer,
              provider,
              requestCategory: serviceRequest.category,
              requestArea: serviceRequest.area,
              providerAreas: match?.coverage_areas ?? [],
            };
          })
        )
      ).filter((x): x is NonNullable<typeof x> => x != null)
    );

    return ok({
      offers: ranked,
      label: "Demo offers",
      count: ranked.length,
    });
  } catch (err) {
    console.error(err);
    return fail("DEMO_OFFERS_FAILED", "Could not load demo offers", 500);
  }
}
