const DEFAULT_RETURN_TO = "/chat";

export function getSafeReturnTo(value: string | null | undefined, fallback = DEFAULT_RETURN_TO) {
  const candidate = value?.trim();

  if (!candidate) {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }

  return candidate;
}
