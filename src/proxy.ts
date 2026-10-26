import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zentravo-giftshop-luxury-secure-token-secret-2026-production"
);
const COOKIE_NAME = "zentravo_auth_token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isPosRoute = pathname.startsWith("/pos");

  if (!isAdminRoute && !isPosRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (isAdminRoute) {
      const allowedAdminRoles = ["SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF", "ACCOUNTANT"];
      if (!allowedAdminRoles.includes(role)) {
        return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
      }
    }

    if (isPosRoute) {
      const allowedPosRoles = ["SUPER_ADMIN", "ADMIN", "CASHIER"];
      if (!allowedPosRoles.includes(role)) {
        return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*"],
};
