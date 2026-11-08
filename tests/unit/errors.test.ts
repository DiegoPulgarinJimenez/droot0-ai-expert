import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, handleApiError } from "@/server/http/api-error";
import { assertSameOrigin } from "@/server/http/security";

describe("API error handling", () => {
  it("serializes known API errors", async () => {
    const response = handleApiError(new ApiError(404, "NOT_FOUND", "Conversation not found."));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Conversation not found.",
      },
    });
  });

  it("maps Zod errors to field errors", async () => {
    const schema = z.object({
      email: z.email(),
      name: z.string().min(2),
    });
    const result = schema.safeParse({ email: "bad", name: "A" });

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const response = handleApiError(result.error);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fieldErrors.email).toBeDefined();
    expect(body.error.fieldErrors.name).toBeDefined();
  });

  it("does not expose unknown errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = handleApiError(new Error("database password leaked"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred.",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("assertSameOrigin", () => {
  const url = "http://localhost:3000/api/chat";

  it("allows requests without an Origin header", () => {
    expect(() => assertSameOrigin(new Request(url))).not.toThrow();
  });

  it("allows same-origin requests", () => {
    expect(() =>
      assertSameOrigin(
        new Request(url, {
          headers: { Origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
  });

  it("rejects cross-origin requests", () => {
    expect(() =>
      assertSameOrigin(
        new Request(url, {
          headers: { Origin: "https://evil.example" },
        }),
      ),
    ).toThrow(expect.objectContaining({ status: 403, code: "FORBIDDEN" }));
  });
});
