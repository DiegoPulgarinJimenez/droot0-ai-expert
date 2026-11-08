import { beforeEach, describe, expect, it, vi } from "vitest";
import { authUserFixture, adminStatsFixture, chatResponseFixture } from "@/lib/contracts/fixtures";
import { makeUser, testIds } from "../helpers/factories";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  toAuthUserDto: vi.fn(),
  sendChatMessage: vi.fn(),
  listAdminUsers: vi.fn(),
  updateAdminUserRole: vi.fn(),
  getAdminStats: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireUser: mocks.requireUser,
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/auth/profile", () => ({
  toAuthUserDto: mocks.toAuthUserDto,
}));

vi.mock("@/server/services/chat", () => ({
  sendChatMessage: mocks.sendChatMessage,
}));

vi.mock("@/server/services/admin-users", () => ({
  listAdminUsers: mocks.listAdminUsers,
  updateAdminUserRole: mocks.updateAdminUserRole,
}));

vi.mock("@/server/services/admin-stats", () => ({
  getAdminStats: mocks.getAdminStats,
}));

import { GET as getAdminStats } from "@/app/api/admin/stats/route";
import { PATCH as patchUserRole } from "@/app/api/admin/users/[id]/role/route";
import { GET as getAdminUsers } from "@/app/api/admin/users/route";
import { GET as getMe } from "@/app/api/auth/me/route";
import { POST as postChat } from "@/app/api/chat/route";
import { ApiError } from "@/server/http/api-error";

function jsonRequest(url: string, body: unknown, origin = "http://localhost:3000") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

describe("API route handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.toAuthUserDto.mockReturnValue(authUserFixture);
    mocks.sendChatMessage.mockResolvedValue(chatResponseFixture);
    mocks.listAdminUsers.mockResolvedValue([authUserFixture]);
    mocks.getAdminStats.mockResolvedValue(adminStatsFixture);
    mocks.updateAdminUserRole.mockResolvedValue(authUserFixture);
  });

  it("returns 401 for an unauthenticated current-user request", async () => {
    mocks.requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHENTICATED", "Authentication required."),
    );

    const response = await getMe();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns the current user", async () => {
    mocks.requireUser.mockResolvedValue(makeUser());

    const response = await getMe();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user).toEqual(authUserFixture);
  });

  it("returns 401 for an unauthenticated chat request", async () => {
    mocks.requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHENTICATED", "Authentication required."),
    );

    const response = await postChat(
      jsonRequest("http://localhost:3000/api/chat", { content: "Hello" }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 422 for invalid chat input", async () => {
    mocks.requireUser.mockResolvedValue(makeUser());

    const response = await postChat(
      jsonRequest("http://localhost:3000/api/chat", { content: "   " }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.fieldErrors.content).toBeDefined();
    expect(mocks.sendChatMessage).not.toHaveBeenCalled();
  });

  it("rejects cross-origin chat requests", async () => {
    mocks.requireUser.mockResolvedValue(makeUser());

    const response = await postChat(
      jsonRequest("http://localhost:3000/api/chat", { content: "Hello" }, "https://evil.example"),
    );

    expect(response.status).toBe(403);
    expect(mocks.sendChatMessage).not.toHaveBeenCalled();
  });

  it("returns a chat response", async () => {
    mocks.requireUser.mockResolvedValue(makeUser());

    const response = await postChat(
      jsonRequest("http://localhost:3000/api/chat", { content: "Hello" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.data).toEqual(chatResponseFixture);
    expect(mocks.sendChatMessage).toHaveBeenCalledWith(testIds.user, {
      content: "Hello",
    });
  });

  it("returns 403 when a non-admin lists users", async () => {
    mocks.requireAdmin.mockRejectedValue(
      new ApiError(403, "FORBIDDEN", "Administrator access required."),
    );

    const response = await getAdminUsers();

    expect(response.status).toBe(403);
  });

  it("lists users for an admin", async () => {
    mocks.requireAdmin.mockResolvedValue(makeUser({ id: testIds.admin, role: "ADMIN" }));

    const response = await getAdminUsers();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.users).toEqual([authUserFixture]);
  });

  it("returns 403 when a non-admin requests statistics", async () => {
    mocks.requireAdmin.mockRejectedValue(
      new ApiError(403, "FORBIDDEN", "Administrator access required."),
    );

    const response = await getAdminStats();

    expect(response.status).toBe(403);
  });

  it("returns statistics for an admin", async () => {
    mocks.requireAdmin.mockResolvedValue(makeUser({ id: testIds.admin, role: "ADMIN" }));

    const response = await getAdminStats();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stats).toEqual(adminStatsFixture);
  });

  it("updates a user role", async () => {
    mocks.requireAdmin.mockResolvedValue(makeUser({ id: testIds.admin, role: "ADMIN" }));

    const response = await patchUserRole(
      jsonRequest("http://localhost:3000/api/admin/users/target-id/role", {
        role: "ADMIN",
      }),
      { params: Promise.resolve({ id: testIds.user }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user).toEqual(authUserFixture);
    expect(mocks.updateAdminUserRole).toHaveBeenCalledWith(testIds.admin, testIds.user, "ADMIN");
  });

  it("rejects an invalid role", async () => {
    mocks.requireAdmin.mockResolvedValue(makeUser({ id: testIds.admin, role: "ADMIN" }));

    const response = await patchUserRole(
      jsonRequest("http://localhost:3000/api/admin/users/target-id/role", {
        role: "SUPERUSER",
      }),
      { params: Promise.resolve({ id: testIds.user }) },
    );

    expect(response.status).toBe(422);
    expect(mocks.updateAdminUserRole).not.toHaveBeenCalled();
  });

  it("propagates role conflict errors", async () => {
    mocks.requireAdmin.mockResolvedValue(makeUser({ id: testIds.admin, role: "ADMIN" }));
    mocks.updateAdminUserRole.mockRejectedValue(
      new ApiError(409, "CONFLICT", "You cannot change your own role."),
    );

    const response = await patchUserRole(
      jsonRequest("http://localhost:3000/api/admin/users/target-id/role", {
        role: "USER",
      }),
      { params: Promise.resolve({ id: testIds.user }) },
    );

    expect(response.status).toBe(409);
  });
});
