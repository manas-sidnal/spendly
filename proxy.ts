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
  // Public (no login needed): API, build assets, favicon, and the PWA manifest, service worker,
  // offline page and icons. The browser fetches the manifest without cookies, so it must be public.
  matcher: [
    "/((?!api|_next|favicon\\.ico$|manifest\\.webmanifest$|sw\\.js$|offline\\.html$|icon-192\\.png$|icon-512\\.png$|icon-512-maskable\\.png$|apple-touch-icon\\.png$).*)",
  ],
};