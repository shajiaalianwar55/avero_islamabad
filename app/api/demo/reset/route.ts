import { ok, fail } from "@/lib/api";
import { resetDemoStore, DEMO_HOME_ID, DEMO_USER_ID } from "@/lib/demo/store";
import { env } from "@/lib/env";

export async function POST() {
  try {
    if (!env.NEXT_PUBLIC_DEMO_MODE) {
      return fail(
        "DEMO_DISABLED",
        "Demo reset only available when NEXT_PUBLIC_DEMO_MODE=true",
        403
      );
    }

    const store = resetDemoStore();

    return ok({
      reset: true,
      demo_user_id: DEMO_USER_ID,
      demo_home_id: DEMO_HOME_ID,
      providers: store.providers.length,
      repair_records: store.repairRecords.length,
    });
  } catch (err) {
    console.error(err);
    return fail("DEMO_RESET_FAILED", "Could not reset demo store", 500);
  }
}
