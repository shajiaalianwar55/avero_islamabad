import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.string().optional().default("openai"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional().default("gpt-4o-mini"),
  NEXT_PUBLIC_DEMO_MODE: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  });

  if (!parsed.success) {
    console.warn("Env validation warnings:", parsed.error.flatten().fieldErrors);
    return {
      AI_PROVIDER: "openai",
      AI_MODEL: "gpt-4o-mini",
      NEXT_PUBLIC_DEMO_MODE: true,
    };
  }

  return parsed.data;
}

export const env = loadEnv();

export function hasSupabaseConfig(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasAiConfig(): boolean {
  return Boolean(env.AI_API_KEY);
}
