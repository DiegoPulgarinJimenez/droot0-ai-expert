import { updateUserRoleRequestSchema } from "@/lib/contracts/admin";
import { uuidSchema } from "@/lib/contracts/common";
import { requireAdmin } from "@/server/auth/current-user";
import { handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";
import { updateAdminUserRole } from "@/server/services/admin-users";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const { id } = await context.params;
    const targetId = uuidSchema.parse(id);
    const body = await parseJsonBody(request);
    const input = updateUserRoleRequestSchema.parse(body);
    const user = await updateAdminUserRole(actor.id, targetId, input.role);

    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
