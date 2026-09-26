import { z } from "zod";
import { env, hasAiConfig } from "@/lib/env";

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiJsonOptions = {
  system: string;
  user: string;
  temperature?: number;
};

export type ChatCompletionOptions = {
  messages: AiChatMessage[];
  temperature?: number;
  json?: boolean;
};

/**
 * OpenAI-compatible chat completions (works with OpenAI and compatible gateways).
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const provider = (env.AI_PROVIDER || "openai").toLowerCase();

  if (!hasAiConfig() || provider === "mock") {
    throw new Error("AI_MOCK_REQUIRED");
  }

  if (provider === "anthropic") {
    return completeAnthropicText(options);
  }

  // Default: OpenAI-compatible /v1/chat/completions
  return completeOpenAiCompatible(options);
}

export async function completeJson<T>(options: AiJsonOptions): Promise<T> {
  const content = await chatCompletion({
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    temperature: options.temperature ?? 0.2,
    json: true,
  });
  return JSON.parse(content) as T;
}

async function completeOpenAiCompatible(
  options: ChatCompletionOptions
): Promise<string> {
  const base =
    process.env.AI_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.AI_MODEL || "gpt-4o-mini",
      temperature: options.temperature ?? 0.2,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
      messages: options.messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI-compatible error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return typeof content === "string" ? content : JSON.stringify(content);
}

async function completeAnthropicText(
  options: ChatCompletionOptions
): Promise<string> {
  const system = options.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const messages = options.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.AI_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.AI_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 1024,
      temperature: options.temperature ?? 0.2,
      system: options.json
        ? `${system}\nRespond with valid JSON only.`
        : system,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.content?.find(
    (c: { type: string }) => c.type === "text"
  )?.text;
  if (!content) throw new Error("Empty AI response");
  return content.replace(/^```json\n?|\n?```$/g, "").trim();
}

/**
 * Run AI JSON generation, validate with Zod, retry once on malformed output,
 * then use deterministic fallback.
 */
export async function completeValidatedJson<T>(options: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  fallback: () => T;
  temperature?: number;
}): Promise<T> {
  const attempt = async (): Promise<T> => {
    const raw = await completeJson<unknown>({
      system: options.system,
      user: options.user,
      temperature: options.temperature,
    });
    return options.schema.parse(raw);
  };

  try {
    return await attempt();
  } catch {
    try {
      return await attempt();
    } catch {
      return options.fallback();
    }
  }
}

export async function withAiRetry<T>(
  fn: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await fn();
  } catch {
    try {
      return await fn();
    } catch {
      return fallback();
    }
  }
}

/** Shared fixture detectors for demo / offline fallbacks */
export function detectFixture(
  text: string
): "sink_leak" | "dirty_ac_filter" | "buzzing_socket" | "unknown" {
  const t = text.toLowerCase();
  if (
    (t.includes("socket") && (t.includes("buzz") || t.includes("burning"))) ||
    (t.includes("buzzing") && t.includes("burn"))
  ) {
    return "buzzing_socket";
  }
  if (
    (t.includes("ac") || t.includes("air conditioner") || t.includes("aircon")) &&
    (t.includes("filter") || t.includes("dirty") || t.includes("airflow"))
  ) {
    return "dirty_ac_filter";
  }
  if (
    (t.includes("sink") && (t.includes("leak") || t.includes("leaking"))) ||
    (t.includes("kitchen") && t.includes("leak"))
  ) {
    return "sink_leak";
  }
  return "unknown";
}
