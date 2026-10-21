import { NextResponse, type NextRequest } from "next/server";
import { translate } from "@/i18n/translate";
import { getBasicAuthConfig, isAuthorized } from "@/lib/auth/basic-auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const REALM = 'Basic realm="Tomorrow Milestones", charset="UTF-8"';

export function middleware(request: NextRequest) {
  const auth = getBasicAuthConfig(process.env);

  if (auth.mode === "disabled") return NextResponse.next();

  if (auth.mode === "misconfigured") {
    console.error("[auth] BASIC_AUTH_USER and BASIC_AUTH_PASSWORD must be set");
    return new NextResponse(translate("errors.api.auth_misconfigured"), {
      status: 500,
    });
  }

  if (isAuthorized(request.headers.get("authorization"), auth.credentials)) {
    return NextResponse.next();
  }

  return new NextResponse(translate("errors.api.unauthorized"), {
    status: 401,
    headers: { "WWW-Authenticate": REALM },
  });
}
