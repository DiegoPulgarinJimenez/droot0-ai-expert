import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAssistantReply } from "@/server/ai/deepseek";

const request = {
  messages: [{ role: "user" as const, content: "Hello" }],
  model: "deepseek-chat",
  temperature: 0.3,
  maxTokens: 1024,
};

describe("DeepSeek provider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-api-key");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://deepseek.example.com/");
    vi.stubEnv("DEEPSEEK_TIMEOUT_MS", "5000");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the assistant content", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "  A concise answer.  " } }],
        }),
        { status: 200 },
      ),
    );

    await expect(generateAssistantReply(request)).resolves.toBe("A concise answer.");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://deepseek.example.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  it("maps provider rate limits to 429", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 429 }));

    await expect(generateAssistantReply(request)).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
    });
  });

  it("maps provider failures to 502", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(generateAssistantReply(request)).rejects.toMatchObject({
      status: 502,
      code: "AI_PROVIDER_ERROR",
    });
  });

  it("rejects invalid provider responses", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 }));

    await expect(generateAssistantReply(request)).rejects.toMatchObject({
      status: 502,
      code: "AI_PROVIDER_ERROR",
    });
  });

  it("rejects empty assistant content", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "   " } }] }), {
        status: 200,
      }),
    );

    await expect(generateAssistantReply(request)).rejects.toMatchObject({
      status: 502,
      code: "AI_PROVIDER_ERROR",
    });
  });

  it("maps aborted requests to 504", async () => {
    vi.stubEnv("DEEPSEEK_TIMEOUT_MS", "10");
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit).signal;

          signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );

    await expect(generateAssistantReply(request)).rejects.toMatchObject({
      status: 504,
      code: "AI_TIMEOUT",
    });
  });

  it("rejects missing provider configuration", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    await expect(generateAssistantReply(request)).rejects.toMatchObject({
      status: 500,
      code: "INTERNAL_ERROR",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
