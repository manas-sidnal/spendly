import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/jwt";

// Guards pages only. API routes check the session themselves.
export async function proxy(req: NextRequest) {
  const userId = await verifyToken(req.cookies.get(COOKIE_NAME)?.value);
  const isLogin = req.nextUrl.pathname === "/login";

  if (!userId && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (userId && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};