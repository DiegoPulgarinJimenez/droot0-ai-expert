import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorCode, FieldErrors } from "@/lib/contracts/common";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, code: ApiErrorCode, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(422, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }
}

export function fieldErrorsFromZod(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "_root";
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return fieldErrors;
}

export function jsonErrorResponse(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    },
    {
      status: error.status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return jsonErrorResponse(error);
  }

  if (error instanceof ZodError) {
    return jsonErrorResponse(
      new ApiError(
        422,
        "VALIDATION_ERROR",
        "The request contains invalid fields.",
        fieldErrorsFromZod(error),
      ),
    );
  }

  console.error("Unhandled API error:", error);

  return jsonErrorResponse(
    new ApiError(500, "INTERNAL_ERROR", "An unexpected server error occurred."),
  );
}
