import { ApiError } from "@/server/http/api-error";

type AuthProviderError = {
  status?: number;
  message?: string;
};

export function isDuplicateEmailError(error: AuthProviderError) {
  return /already|registered|exists/i.test(error.message ?? "");
}

export function throwRegistrationError(error: AuthProviderError): never {
  if (error.status === 429) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Too many authentication attempts. Please try again later.",
    );
  }

  if (isDuplicateEmailError(error)) {
    throw new ApiError(409, "CONFLICT", "An account with this email already exists.");
  }

  throw new ApiError(500, "INTERNAL_ERROR", "Authentication service is unavailable.");
}

export function throwLoginError(error: AuthProviderError): never {
  if (error.status === 429) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Too many authentication attempts. Please try again later.",
    );
  }

  if (error.status === 400 || error.status === 401) {
    throw new ApiError(401, "UNAUTHENTICATED", "Invalid email or password.");
  }

  throw new ApiError(500, "INTERNAL_ERROR", "Authentication service is unavailable.");
}
