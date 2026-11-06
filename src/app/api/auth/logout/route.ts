import { ApiError, handleApiError } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";
import { createSupabaseServerClient } from "@/server/auth/server-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error && error.status !== 400) {
      if (error.status === 429) {
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Too many authentication attempts. Please try again later.",
        );
      }

      throw new ApiError(500, "INTERNAL_ERROR", "Authentication service is unavailable.");
    }

    return jsonOk({
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
