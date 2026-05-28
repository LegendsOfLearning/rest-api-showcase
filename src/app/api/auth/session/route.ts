import { NextResponse } from "next/server";
import { legendsApiBaseUrl } from "@/lib/server/api-base";

const API_VERSION = process.env.LEGENDS_API_VERSION || "v3";

type SessionPayload = {
  access_token?: string;
};

async function validateAccessToken(accessToken: string) {
  const response = await fetch(`${legendsApiBaseUrl()}/${API_VERSION}/applications/me`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return response.ok;
}

export async function POST(request: Request) {
  try {
    const { access_token: accessToken } = (await request.json()) as SessionPayload;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Access token is required." },
        { status: 400 }
      );
    }

    const valid = await validateAccessToken(accessToken);

    if (!valid) {
      return NextResponse.json(
        { message: "The Console session could not be verified." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session handoff error:", error);
    return NextResponse.json(
      { message: "Failed to create showcase session." },
      { status: 500 }
    );
  }
}
