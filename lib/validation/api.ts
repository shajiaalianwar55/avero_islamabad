import { z } from "zod";
import type { ApiResponse } from "@/types";

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): ApiResponse<never> {
  return { ok: false, error: { code, message } };
}

export function parseJsonBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: ApiResponse<never> } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request"),
    };
  }
  return { success: true, data: parsed.data };
}
