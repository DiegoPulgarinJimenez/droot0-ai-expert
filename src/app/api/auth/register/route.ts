import { registerRequestSchema } from "@/lib/contracts/auth";
import { syncProfileFromAuthUser, toAuthUserDto } from "@/server/auth/profile";
import { throwRegistrationError } from "@/server/auth/provider-error";
import { createSupabaseServerClient } from "@/server/auth/server-client";
import { ApiError, handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await parseJsonBody(request);
    const input = registerRequestSchema.parse(body);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email.toLowerCase(),
      password: input.password,
      options: {
        data: {
          name: input.name,
        },
      },
    });

    if (error) {
      throwRegistrationError(error);
    }

    if (!data.user) {
      throw new ApiError(500, "INTERNAL_ERROR", "Authentication service did not return a user.");
    }

    if (data.user.identities && data.user.identities.length === 0) {
      throw new ApiError(409, "CONFLICT", "An account with this email already exists.");
    }

    const profile = await syncProfileFromAuthUser(data.user);

    return jsonOk(
      {
        user: toAuthUserDto(profile),
        requiresEmailConfirmation: !data.session,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
