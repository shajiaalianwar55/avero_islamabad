import { ok } from "@/lib/api";
import {
  env,
  hasAiConfig,
  hasSupabaseAdminConfig,
  hasSupabaseConfig,
} from "@/lib/env";

export async function GET() {
  return ok({
    service: "avero",
    demoMode: env.NEXT_PUBLIC_DEMO_MODE,
    supabaseConfigured: hasSupabaseConfig(),
    durableStorageConfigured: hasSupabaseAdminConfig(),
    aiConfigured: hasAiConfig(),
    aiProvider: env.AI_PROVIDER,
  });
}
