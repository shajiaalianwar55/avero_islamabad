import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function ok<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { ok: true, data };
  return NextResponse.json(body, { status });
}

export function fail(code: string, message: string, status = 400) {
  const body: ApiResponse<never> = {
    ok: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status });
}
