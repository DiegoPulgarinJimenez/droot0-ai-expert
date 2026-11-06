import { conversationListQuerySchema } from "@/lib/contracts/conversations";
import { requireUser } from "@/server/auth/current-user";
import { handleApiError } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { listConversations } from "@/server/services/conversations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const query = conversationListQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
    });
    const conversations = await listConversations(user.id, query.limit);

    return jsonOk({ conversations });
  } catch (error) {
    return handleApiError(error);
  }
}
