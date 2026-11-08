import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeConversationWithCount, makeMessage, testIds } from "../../helpers/factories";

const mocks = vi.hoisted(() => ({
  conversation: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    conversation: mocks.conversation,
    message: mocks.message,
  },
}));

import {
  deleteConversation,
  getConversationDetail,
  listConversations,
  renameConversation,
} from "@/server/services/conversations";

describe("conversation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps owned conversations to summaries", async () => {
    const older = makeConversationWithCount({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Older",
    });
    const newer = makeConversationWithCount({
      id: "22222222-2222-4222-8222-222222222222",
      title: "Newer",
      _count: { messages: 4 },
    });

    mocks.conversation.findMany.mockResolvedValue([newer, older]);

    const result = await listConversations(testIds.user, 10);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: newer.id,
      title: "Newer",
      messageCount: 4,
    });
    expect(result[0]?.createdAt).toBe(newer.createdAt.toISOString());
    expect(mocks.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: testIds.user },
        take: 10,
      }),
    );
  });

  it("returns 404 when the conversation is not owned", async () => {
    mocks.conversation.findFirst.mockResolvedValue(null);

    await expect(getConversationDetail(testIds.user, testIds.conversation)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
    expect(mocks.conversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: testIds.conversation,
          userId: testIds.user,
        },
      }),
    );
  });

  it("returns messages in chronological order", async () => {
    const conversation = makeConversationWithCount();
    const userMessage = makeMessage({
      id: "33333333-3333-4333-8333-333333333333",
      role: "USER",
      content: "First",
      createdAt: new Date("2026-11-08T10:00:00.000Z"),
    });
    const assistantMessage = makeMessage({
      id: "44444444-4444-4444-8444-444444444444",
      role: "ASSISTANT",
      content: "Second",
      createdAt: new Date("2026-11-08T10:01:00.000Z"),
    });

    mocks.conversation.findFirst.mockResolvedValue(conversation);
    mocks.message.findMany.mockResolvedValue([assistantMessage, userMessage]);

    const result = await getConversationDetail(testIds.user, testIds.conversation);

    expect(result.messages.map((message) => message.content)).toEqual(["First", "Second"]);
    expect(mocks.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: testIds.conversation },
        take: 200,
      }),
    );
  });

  it("returns 404 when renaming an unowned conversation", async () => {
    mocks.conversation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      renameConversation(testIds.user, testIds.conversation, "Renamed"),
    ).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("renames an owned conversation", async () => {
    const updated = makeConversationWithCount({ title: "Renamed" });

    mocks.conversation.updateMany.mockResolvedValue({ count: 1 });
    mocks.conversation.findUnique.mockResolvedValue(updated);

    const result = await renameConversation(testIds.user, testIds.conversation, "Renamed");

    expect(result.title).toBe("Renamed");
    expect(mocks.conversation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: testIds.conversation,
          userId: testIds.user,
        },
        data: { title: "Renamed" },
      }),
    );
  });

  it("returns 404 when deleting an unowned conversation", async () => {
    mocks.conversation.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteConversation(testIds.user, testIds.conversation)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("deletes an owned conversation", async () => {
    mocks.conversation.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteConversation(testIds.user, testIds.conversation)).resolves.toBeUndefined();
    expect(mocks.conversation.deleteMany).toHaveBeenCalledWith({
      where: {
        id: testIds.conversation,
        userId: testIds.user,
      },
    });
  });
});
