import { renameConversationRequestSchema } from "@/lib/contracts/conversations";
import { uuidSchema } from "@/lib/contracts/common";
import { requireUser } from "@/server/auth/current-user";
import { handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";
import {
  deleteConversation,
  getConversationDetail,
  renameConversation,
} from "@/server/services/conversations";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const conversationId = uuidSchema.parse(id);
    const detail = await getConversationDetail(user.id, conversationId);

    return jsonOk(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    const conversationId = uuidSchema.parse(id);
    const body = await parseJsonBody(request);
    const input = renameConversationRequestSchema.parse(body);
    const conversation = await renameConversation(user.id, conversationId, input.title);

    return jsonOk({ conversation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    const conversationId = uuidSchema.parse(id);
    await deleteConversation(user.id, conversationId);

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
