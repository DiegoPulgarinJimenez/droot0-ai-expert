import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeConversation, makeUser, testIds } from "../../helpers/factories";

const mocks = vi.hoisted(() => ({
  user: {
    count: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
  conversation: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  message: {
    count: vi.fn(),
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: mocks.user,
    conversation: mocks.conversation,
    message: mocks.message,
  },
}));

import { getAdminStats } from "@/server/services/admin-stats";

describe("admin statistics service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns real counts and recent activity", async () => {
    const admin = makeUser({
      id: testIds.admin,
      email: "admin@example.com",
      role: "ADMIN",
    });
    const conversation = makeConversation();

    mocks.user.count.mockResolvedValue(3);
    mocks.conversation.count.mockResolvedValue(2);
    mocks.message.count.mockResolvedValue(7);
    mocks.user.groupBy.mockResolvedValue([
      { role: "USER", _count: { _all: 2 } },
      { role: "ADMIN", _count: { _all: 1 } },
    ]);
    mocks.user.findMany.mockResolvedValue([admin]);
    mocks.conversation.findMany.mockResolvedValue([
      {
        ...conversation,
        user: {
          email: admin.email,
        },
      },
    ]);

    const result = await getAdminStats();

    expect(result.totalUsers).toBe(3);
    expect(result.totalConversations).toBe(2);
    expect(result.totalMessages).toBe(7);
    expect(result.usersByRole).toEqual({ USER: 2, ADMIN: 1 });
    expect(result.recentUsers).toHaveLength(1);
    expect(result.recentConversations).toEqual([
      {
        id: conversation.id,
        title: conversation.title,
        userEmail: admin.email,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
    ]);
    expect(mocks.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    expect(mocks.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it("keeps zero counts for roles without users", async () => {
    mocks.user.count.mockResolvedValue(1);
    mocks.conversation.count.mockResolvedValue(0);
    mocks.message.count.mockResolvedValue(0);
    mocks.user.groupBy.mockResolvedValue([{ role: "ADMIN", _count: { _all: 1 } }]);
    mocks.user.findMany.mockResolvedValue([]);
    mocks.conversation.findMany.mockResolvedValue([]);

    const result = await getAdminStats();

    expect(result.usersByRole).toEqual({ USER: 0, ADMIN: 1 });
    expect(result.recentUsers).toEqual([]);
    expect(result.recentConversations).toEqual([]);
  });
});
