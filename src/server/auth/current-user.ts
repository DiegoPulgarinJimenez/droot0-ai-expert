import "server-only";
import { Role, type User } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";
import { syncProfileFromAuthUser } from "./profile";
import { createSupabaseServerClient } from "./server-client";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const claims = data.claims;
  const profile = await prisma.user.findUnique({
    where: { id: claims.sub },
  });

  if (profile) {
    return profile;
  }

  const email = typeof claims.email === "string" ? claims.email : undefined;
  const metadata =
    claims.user_metadata && typeof claims.user_metadata === "object"
      ? (claims.user_metadata as Record<string, unknown>)
      : undefined;

  return syncProfileFromAuthUser({
    id: claims.sub,
    email,
    user_metadata: metadata,
  });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();

  if (user.role !== Role.ADMIN) {
    throw new ApiError(403, "FORBIDDEN", "Administrator access required.");
  }

  return user;
}
