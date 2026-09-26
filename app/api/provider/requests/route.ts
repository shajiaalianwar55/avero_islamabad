import { ok, fail } from "@/lib/api";
import { listOpenRequests } from "@/lib/db/providers";
import { listOffers } from "@/lib/db/providers";

export async function GET() {
  try {
    const requests = await listOpenRequests();
    const withOfferCounts = await Promise.all(
      requests.map(async (r) => {
        const offers = await listOffers(r.id);
        return { ...r, offer_count: offers.length };
      })
    );

    return ok({ requests: withOfferCounts });
  } catch (err) {
    console.error(err);
    return fail("PROVIDER_REQUESTS_FAILED", "Could not load requests", 500);
  }
}
