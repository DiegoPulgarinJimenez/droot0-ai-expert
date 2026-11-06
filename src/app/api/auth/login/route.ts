import { loginRequestSchema } from "@/lib/contracts/auth";
import { syncProfileFromAuthUser, toAuthUserDto } from "@/server/auth/profile";
import { throwLoginError } from "@/server/auth/provider-error";
import { createSupabaseServerClient } from "@/server/auth/server-client";
import { ApiError, handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await parseJsonBody(request);
    const input = loginRequestSchema.parse(body);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.toLowerCase(),
      password: input.password,
    });

    if (error) {
      throwLoginError(error);
    }

    if (!data.user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Invalid email or password.");
    }

    const profile = await syncProfileFromAuthUser(data.user);

    return jsonOk({
      user: toAuthUserDto(profile),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
