import "server-only";
import type { User } from "@prisma/client";
import type { AuthUser } from "@/lib/contracts/auth";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";

type AuthProfileSource = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function getProfileName(metadata: Record<string, unknown> | null | undefined, email: string) {
  const metadataName = typeof metadata?.name === "string" ? metadata.name.trim() : "";
  const emailName = email.split("@")[0]?.trim() ?? "";
  const candidate = metadataName || emailName || "User";

  return candidate.length >= 2 ? candidate.slice(0, 80) : "User";
}

export async function syncProfileFromAuthUser(authUser: AuthProfileSource): Promise<User> {
  const email = authUser.email?.trim().toLowerCase();

  if (!email) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "The authenticated account does not have an email address.",
    );
  }

  const name = getProfileName(authUser.user_metadata, email);

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email,
      name,
    },
    create: {
      id: authUser.id,
      email,
      name,
      role: "USER",
    },
  });
}

export function toAuthUserDto(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
