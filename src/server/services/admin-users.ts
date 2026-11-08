import "server-only";
import { Role } from "@prisma/client";
import type { AuthUser } from "@/lib/contracts/auth";
import { toAuthUserDto } from "@/server/auth/profile";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";

export async function listAdminUsers(): Promise<AuthUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map(toAuthUserDto);
}

export async function updateAdminUserRole(
  actorId: string,
  targetId: string,
  role: Role,
): Promise<AuthUser> {
  if (actorId === targetId) {
    throw new ApiError(409, "CONFLICT", "You cannot change your own role.");
  }

  return prisma.$transaction(async (transaction) => {
    const target = await transaction.user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new ApiError(404, "NOT_FOUND", "User not found.");
    }

    if (target.role === role) {
      return toAuthUserDto(target);
    }

    if (target.role === Role.ADMIN && role !== Role.ADMIN) {
      const adminCount = await transaction.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ApiError(409, "CONFLICT", "The last administrator cannot be demoted.");
      }
    }

    const updated = await transaction.user.update({
      where: { id: targetId },
      data: { role },
    });

    return toAuthUserDto(updated);
  });
}
