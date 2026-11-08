import { requireAdmin } from "@/server/auth/current-user";
import { handleApiError } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { listAdminUsers } from "@/server/services/admin-users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const users = await listAdminUsers();

    return jsonOk({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
