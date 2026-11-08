import { updateAssistantConfigRequestSchema } from "@/lib/contracts/admin";
import { requireAdmin } from "@/server/auth/current-user";
import { handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";
import { getAssistantConfig, updateAssistantConfig } from "@/server/services/assistant-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const config = await getAssistantConfig();

    return jsonOk({ config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const body = await parseJsonBody(request);
    const input = updateAssistantConfigRequestSchema.parse(body);
    const config = await updateAssistantConfig(input, actor.id);

    return jsonOk({ config });
  } catch (error) {
    return handleApiError(error);
  }
}
