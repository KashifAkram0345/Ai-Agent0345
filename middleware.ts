import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "nova_session";
const SESSION_HEADER = "x-nova-session";

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SESSION_HEADER, sessionId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!request.cookies.has(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};