import { ok } from "@/lib/api";
import { env, hasAiConfig, hasSupabaseConfig } from "@/lib/env";

export async function GET() {
  return ok({
    service: "avero",
    demoMode: env.NEXT_PUBLIC_DEMO_MODE,
    supabaseConfigured: hasSupabaseConfig(),
    aiConfigured: hasAiConfig(),
    aiProvider: env.AI_PROVIDER,
  });
}
