import { NextResponse } from "next/server";
import { defaultShowcaseEnvironment, legendsApiBaseUrl } from "@/lib/server/api-base";
import { parseShowcaseEnvironment, SHOWCASE_ENVIRONMENT_COOKIE } from "@/lib/api/environment";

const API_VERSION = process.env.LEGENDS_API_VERSION || "v3";

export async function POST(request: Request) {
  try {
    const { access_token: token, environment: requestedEnvironment, application_id: applicationId } = await request.json();
    if (typeof token !== "string" || !token || token.length > 16384) {
      return NextResponse.json({ message: "A valid access token is required." }, { status: 400 });
    }
    let environment;
    try { environment = requestedEnvironment === undefined ? defaultShowcaseEnvironment() : parseShowcaseEnvironment(requestedEnvironment); }
    catch { return NextResponse.json({ message: "Select staging or production before connecting." }, { status: 400 }); }
    if (applicationId !== undefined && typeof applicationId !== "string" && typeof applicationId !== "number") {
      return NextResponse.json({ message: "The selected application could not be verified." }, { status: 400 });
    }
    const identity = await fetch(`${legendsApiBaseUrl(environment)}/${API_VERSION}/applications/me`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
    });
    if (!identity.ok) {
      return NextResponse.json({ message: "The Console session could not be verified in the selected environment." }, { status: 401 });
    }
    const application = await identity.json();
    if (applicationId !== undefined && String(application.id) !== String(applicationId)) {
      return NextResponse.json({ message: "The Console session does not belong to the selected application." }, { status: 401 });
    }
    const response = NextResponse.json({ success: true, environment });
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 60 * 60, path: "/" };
    response.cookies.set("auth_token", token, options);
    response.cookies.set(SHOWCASE_ENVIRONMENT_COOKIE, environment, options);
    return response;
  } catch {
    return NextResponse.json({ message: "Could not verify the selected showcase session." }, { status: 502 });
  }
}
