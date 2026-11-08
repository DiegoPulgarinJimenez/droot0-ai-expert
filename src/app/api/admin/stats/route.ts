import { requireAdmin } from "@/server/auth/current-user";
import { handleApiError } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { getAdminStats } from "@/server/services/admin-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminStats();

    return jsonOk({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
