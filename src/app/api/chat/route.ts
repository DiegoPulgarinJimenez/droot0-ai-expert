import { chatRequestSchema } from "@/lib/contracts/chat";
import { requireUser } from "@/server/auth/current-user";
import { handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";
import { sendChatMessage } from "@/server/services/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = await parseJsonBody(request);
    const input = chatRequestSchema.parse(body);
    const response = await sendChatMessage(user.id, input);

    return jsonOk(response);
  } catch (error) {
    return handleApiError(error);
  }
}
