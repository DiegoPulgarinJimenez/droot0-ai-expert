import "server-only";
import type { AdminStats } from "@/lib/contracts/admin";
import { toAuthUserDto } from "@/server/auth/profile";
import { prisma } from "@/server/db/prisma";

const RECENT_ACTIVITY_LIMIT = 5;

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalConversations,
    totalMessages,
    usersByRole,
    recentUsers,
    recentConversations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: {
        _all: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.conversation.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: RECENT_ACTIVITY_LIMIT,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  const roleCounts = {
    USER: 0,
    ADMIN: 0,
  };

  for (const row of usersByRole) {
    roleCounts[row.role] = row._count._all;
  }

  return {
    totalUsers,
    totalConversations,
    totalMessages,
    usersByRole: roleCounts,
    recentUsers: recentUsers.map(toAuthUserDto),
    recentConversations: recentConversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      userEmail: conversation.user.email,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    })),
  };
}
