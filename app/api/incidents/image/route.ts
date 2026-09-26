import { ok, fail } from "@/lib/api";

/**
 * Image upload for triage context.
 * Demo path never breaks text triage when storage is unavailable.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail("VALIDATION_ERROR", "file required");
    }

    return ok({
      url: `demo-upload://${encodeURIComponent(file.name)}`,
      note: "Demo upload path — wire Supabase Storage in production. Text triage continues either way.",
    });
  } catch {
    return ok({
      url: null,
      note: "Image upload failed — continue with text.",
      failed: true,
    });
  }
}
