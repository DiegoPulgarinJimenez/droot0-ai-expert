import { toAuthUserDto } from "@/server/auth/profile";
import { requireUser } from "@/server/auth/current-user";
import { handleApiError } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    return jsonOk({
      user: toAuthUserDto(user),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
