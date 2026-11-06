import { NextResponse } from "next/server";

export function jsonOk<T>(
  data: T,
  init?: {
    status?: number;
    headers?: HeadersInit;
  },
) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");

  return NextResponse.json(
    { data },
    {
      status: init?.status ?? 200,
      headers,
    },
  );
}
