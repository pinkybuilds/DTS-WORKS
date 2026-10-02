
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("🔥 PROXY RUNNING:", pathname);

  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/receipts") ||
    pathname.startsWith("/compliance") ||
    pathname.startsWith("/site-profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  const { response, user } = await updateSession(request);
  console.log("👤 PROXY USER:", user?.id ?? "NO USER");
console.log(
  "📧 EMAIL CONFIRMED:",
  user?.email_confirmed_at ?? "NOT CONFIRMED",
);
console.log("📧 EMAIL:", user?.email ?? "NO EMAIL");

  // User is not authenticated but is trying to access the app.
  if (isProtectedRoute && !user) {
    console.log("🔒 NO USER — REDIRECTING TO LOGIN");

    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", pathname);

    return Response.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/receipts/:path*",
    "/compliance/:path*",
    "/site-profile/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/onboarding",
  ],
};

