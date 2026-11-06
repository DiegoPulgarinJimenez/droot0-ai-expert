import { ApiError } from "./api-error";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new ApiError(403, "FORBIDDEN", "Invalid request origin.");
  }

  const requestUrl = new URL(request.url);

  if (parsedOrigin.origin !== requestUrl.origin) {
    throw new ApiError(403, "FORBIDDEN", "Invalid request origin.");
  }
}
