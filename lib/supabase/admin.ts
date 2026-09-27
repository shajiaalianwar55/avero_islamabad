import { createClient } from "@supabase/supabase-js";
import {
  env,
  hasSupabaseAdminConfig,
  supabaseSecretKey,
} from "@/lib/env";

export function createServiceClient() {
  const secretKey = supabaseSecretKey();
  if (!hasSupabaseAdminConfig() || !secretKey) {
    throw new Error(
      "Supabase server access is not configured. Set SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
