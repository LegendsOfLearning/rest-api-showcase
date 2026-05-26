import { NextResponse } from "next/server";
import { LEGENDS_OPENAPI_SPEC_URL } from "@/lib/api/reference";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const response = await fetch(LEGENDS_OPENAPI_SPEC_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const bodyBytes = new TextEncoder().encode(body).length;

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          url: LEGENDS_OPENAPI_SPEC_URL,
          statusCode: response.status,
          contentType,
          latencyMs: Date.now() - startedAt,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      ok: true,
      url: LEGENDS_OPENAPI_SPEC_URL,
      statusCode: response.status,
      contentType,
      bytes: bodyBytes,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        url: LEGENDS_OPENAPI_SPEC_URL,
        message: error instanceof Error ? error.message : "OpenAPI reference check failed.",
        latencyMs: Date.now() - startedAt,
      },
      { status: 502 },
    );
  }
}
