import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/auth";
import { localDemoModeEnabled, multiUserRolloutEnabled } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  if (!multiUserRolloutEnabled()) return new NextResponse("Twutor multi-user access is not enabled yet.", { status: 503 });
  if (localDemoModeEnabled()) return NextResponse.next();

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (session) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!api/auth|sign-in|sign-up|_next/static|_next/image|favicon.ico|assets).*)"]
};
