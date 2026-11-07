import "server-only";
import { z } from "zod";
import { ApiError } from "@/server/http/api-error";

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GenerateAssistantReplyInput = {
  messages: DeepSeekMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
};

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_TIMEOUT_MS = 50_000;

const deepSeekResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().optional().nullable(),
        }),
      }),
    )
    .min(1),
});

function getBaseUrl() {
  return (process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function getTimeoutMs() {
  const configured = Number(process.env.DEEPSEEK_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

function getApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new ApiError(500, "INTERNAL_ERROR", "The AI provider is not configured.");
  }

  return apiKey;
}

export async function generateAssistantReply({
  messages,
  model,
  temperature,
  maxTokens,
}: GenerateAssistantReplyInput): Promise<string> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    let response: Response;

    try {
      response = await fetch(`${getBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError(504, "AI_TIMEOUT", "The assistant took too long to respond.");
      }

      console.error(
        "DeepSeek request failed:",
        error instanceof Error ? error.message : "Unknown provider error",
      );
      throw new ApiError(502, "AI_PROVIDER_ERROR", "The assistant provider is unavailable.");
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "The assistant is receiving too many requests. Please try again shortly.",
        );
      }

      console.error("DeepSeek returned an error status:", response.status);
      throw new ApiError(502, "AI_PROVIDER_ERROR", "The assistant could not generate a response.");
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new ApiError(502, "AI_PROVIDER_ERROR", "The assistant returned an invalid response.");
    }

    const parsed = deepSeekResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError(502, "AI_PROVIDER_ERROR", "The assistant returned an invalid response.");
    }

    const content = parsed.data.choices[0]?.message.content?.trim();

    if (!content) {
      throw new ApiError(502, "AI_PROVIDER_ERROR", "The assistant returned an empty response.");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}
