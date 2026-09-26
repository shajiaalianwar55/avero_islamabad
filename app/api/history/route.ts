import { ok, fail } from "@/lib/api";
import { listRepairHistory, getHome, listHomeAssets } from "@/lib/db/history";
import { DEMO_HOME_ID } from "@/lib/demo/store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const homeId = url.searchParams.get("home_id") ?? DEMO_HOME_ID;

    const [home, assets, repairs] = await Promise.all([
      getHome(homeId),
      listHomeAssets(homeId),
      listRepairHistory(homeId),
    ]);

    return ok({
      home,
      assets,
      repairs,
    });
  } catch (err) {
    console.error(err);
    return fail("HISTORY_FAILED", "Could not load home history", 500);
  }
}
