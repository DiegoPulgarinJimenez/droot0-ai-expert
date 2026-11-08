import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeAssistantConfig,
  makeConversation,
  makeConversationWithCount,
  makeMessage,
  testIds,
} from "../../helpers/factories";

const mocks = vi.hoisted(() => {
  const conversation = {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  };

  const message = {
    findMany: vi.fn(),
    create: vi.fn(),
  };

  const assistantConfig = {
    findUnique: vi.fn(),
  };

  const transaction = vi.fn(
    async (
      callback: (transaction: {
        conversation: typeof conversation;
        message: typeof message;
      }) => Promise<unknown>,
    ) => callback({ conversation, message }),
  );

  const generateAssistantReply = vi.fn();

  return {
    conversation,
    message,
    assistantConfig,
    transaction,
    generateAssistantReply,
  };
});

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    conversation: mocks.conversation,
    message: mocks.message,
    assistantConfig: mocks.assistantConfig,
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/server/ai/deepseek", () => ({
  generateAssistantReply: mocks.generateAssistantReply,
}));

import { ApiError } from "@/server/http/api-error";
import { sendChatMessage } from "@/server/services/chat";

function setupSuccessfulTransaction() {
  const conversation = makeConversationWithCount({
    id: testIds.conversation,
    title: "Test conversation",
  });
  const userMessage = makeMessage({
    id: "33333333-3333-4333-8333-333333333333",
    role: "USER",
    content: "Hello",
    createdAt: new Date("2026-11-08T10:01:00.000Z"),
  });
  const assistantMessage = makeMessage({
    id: "44444444-4444-4444-8444-444444444444",
    role: "ASSISTANT",
    content: "AI answer",
    createdAt: new Date("2026-11-08T10:02:00.000Z"),
  });

  mocks.conversation.create.mockResolvedValue(makeConversation());
  mocks.conversation.updateMany.mockResolvedValue({ count: 1 });
  mocks.conversation.findUniqueOrThrow.mockResolvedValue({
    ...conversation,
    _count: { messages: 2 },
  });
  mocks.message.create.mockResolvedValueOnce(userMessage).mockResolvedValueOnce(assistantMessage);

  return { conversation, userMessage, assistantMessage };
}

describe("chat service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(
      async (
        callback: (transaction: {
          conversation: typeof mocks.conversation;
          message: typeof mocks.message;
        }) => Promise<unknown>,
      ) => callback({ conversation: mocks.conversation, message: mocks.message }),
    );
    mocks.assistantConfig.findUnique.mockResolvedValue(makeAssistantConfig());
  });

  it("creates a conversation and persists both messages", async () => {
    const { conversation, userMessage, assistantMessage } = setupSuccessfulTransaction();
    mocks.generateAssistantReply.mockResolvedValue("AI answer");

    const result = await sendChatMessage(testIds.user, {
      content: "Hello",
    });

    expect(mocks.generateAssistantReply).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: "system",
            content: "You are a programming assistant.",
          },
          {
            role: "user",
            content: "Hello",
          },
        ],
        model: "deepseek-chat",
        temperature: 0.3,
        maxTokens: 2048,
      }),
    );
    expect(mocks.conversation.create).toHaveBeenCalledWith({
      data: {
        userId: testIds.user,
        title: "Hello",
      },
    });
    expect(mocks.message.create).toHaveBeenNthCalledWith(1, {
      data: {
        conversationId: testIds.conversation,
        role: "USER",
        content: "Hello",
      },
    });
    expect(mocks.message.create).toHaveBeenNthCalledWith(2, {
      data: {
        conversationId: testIds.conversation,
        role: "ASSISTANT",
        content: "AI answer",
      },
    });
    expect(result.conversation.id).toBe(conversation.id);
    expect(result.conversation.messageCount).toBe(2);
    expect(result.userMessage.id).toBe(userMessage.id);
    expect(result.assistantMessage.id).toBe(assistantMessage.id);
  });

  it("loads prior context for an existing conversation", async () => {
    const conversation = makeConversationWithCount();
    const priorUserMessage = makeMessage({
      id: "55555555-5555-4555-8555-555555555555",
      role: "USER",
      content: "Prior question",
      createdAt: new Date("2026-11-08T09:00:00.000Z"),
    });
    const priorAssistantMessage = makeMessage({
      id: "66666666-6666-4666-8666-666666666666",
      role: "ASSISTANT",
      content: "Prior answer",
      createdAt: new Date("2026-11-08T09:01:00.000Z"),
    });

    mocks.conversation.findFirst.mockResolvedValue(conversation);
    mocks.message.findMany.mockResolvedValue([priorAssistantMessage, priorUserMessage]);
    mocks.generateAssistantReply.mockResolvedValue("New answer");
    mocks.conversation.updateMany.mockResolvedValue({ count: 1 });
    mocks.conversation.findUniqueOrThrow.mockResolvedValue({
      ...conversation,
      _count: { messages: 4 },
    });
    mocks.message.create
      .mockResolvedValueOnce(
        makeMessage({
          role: "USER",
          content: "Follow-up",
          createdAt: new Date("2026-11-08T10:00:00.000Z"),
        }),
      )
      .mockResolvedValueOnce(
        makeMessage({
          role: "ASSISTANT",
          content: "New answer",
          createdAt: new Date("2026-11-08T10:01:00.000Z"),
        }),
      );

    await sendChatMessage(testIds.user, {
      conversationId: testIds.conversation,
      content: "Follow-up",
    });

    expect(mocks.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: testIds.conversation },
        take: 20,
      }),
    );
    expect(mocks.generateAssistantReply).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: "system",
            content: "You are a programming assistant.",
          },
          {
            role: "user",
            content: "Prior question",
          },
          {
            role: "assistant",
            content: "Prior answer",
          },
          {
            role: "user",
            content: "Follow-up",
          },
        ],
      }),
    );
  });

  it("rejects a foreign conversation before calling the provider", async () => {
    mocks.conversation.findFirst.mockResolvedValue(null);

    await expect(
      sendChatMessage(testIds.user, {
        conversationId: testIds.conversation,
        content: "Hello",
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
    expect(mocks.generateAssistantReply).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not persist when the provider fails", async () => {
    mocks.generateAssistantReply.mockRejectedValue(
      new ApiError(502, "AI_PROVIDER_ERROR", "The assistant provider is unavailable."),
    );

    await expect(
      sendChatMessage(testIds.user, {
        content: "Hello",
      }),
    ).rejects.toMatchObject({
      status: 502,
      code: "AI_PROVIDER_ERROR",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.conversation.create).not.toHaveBeenCalled();
  });

  it("truncates a long generated title", async () => {
    setupSuccessfulTransaction();
    mocks.generateAssistantReply.mockResolvedValue("AI answer");

    await sendChatMessage(testIds.user, {
      content: "a".repeat(120),
    });

    const createCall = mocks.conversation.create.mock.calls[0]?.[0];
    expect(createCall.data.title).toHaveLength(80);
    expect(createCall.data.title.endsWith("...")).toBe(true);
  });
});
