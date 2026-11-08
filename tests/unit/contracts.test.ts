import { describe, expect, it } from "vitest";
import {
  updateAssistantConfigRequestSchema,
  updateUserRoleRequestSchema,
} from "@/lib/contracts/admin";
import { chatRequestSchema } from "@/lib/contracts/chat";
import { conversationListQuerySchema } from "@/lib/contracts/conversations";

describe("shared request contracts", () => {
  it("accepts a valid chat request", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: null,
      content: "Explain closures.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty chat content", () => {
    const result = chatRequestSchema.safeParse({
      content: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid conversation IDs", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: "not-a-uuid",
      content: "Hello",
    });

    expect(result.success).toBe(false);
  });

  it("validates role updates", () => {
    expect(updateUserRoleRequestSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
    expect(updateUserRoleRequestSchema.safeParse({ role: "SUPERUSER" }).success).toBe(false);
  });

  it("validates assistant configuration limits", () => {
    expect(
      updateAssistantConfigRequestSchema.safeParse({
        name: "Programming Expert",
        systemPrompt: "You are a programming assistant.",
        model: "deepseek-chat",
        temperature: 0.3,
        maxTokens: 2048,
      }).success,
    ).toBe(true);

    expect(
      updateAssistantConfigRequestSchema.safeParse({
        name: "",
        systemPrompt: "",
        model: "",
        temperature: 3,
        maxTokens: 0,
      }).success,
    ).toBe(false);
  });

  it("coerces and validates the conversation limit", () => {
    expect(conversationListQuerySchema.parse({ limit: "25" })).toEqual({ limit: 25 });
    expect(conversationListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});
