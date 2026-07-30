import { NextResponse } from "next/server";
import { createPasswordSession, passwordLoginConfigured, sessionCookieMaxAge, sessionCookieName, verifyPasswordCredentials } from "@/app/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = attempts.get(ip);
  if (current && current.resetAt > Date.now() && current.count >= MAX_ATTEMPTS) return redirectWithError(request, "locked");
  if (!passwordLoginConfigured()) return redirectWithError(request, "configuration");

  const form = await request.formData();
  const loginId = String(form.get("loginId") || "").slice(0, 200);
  const password = String(form.get("password") || "").slice(0, 500);
  if (!(await verifyPasswordCredentials(loginId, password))) {
    const resetAt = current?.resetAt && current.resetAt > Date.now() ? current.resetAt : Date.now() + WINDOW_MS;
    attempts.set(ip, { count: (current?.resetAt && current.resetAt > Date.now() ? current.count : 0) + 1, resetAt });
    return redirectWithError(request, "invalid");
  }

  attempts.delete(ip);
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(sessionCookieName(), await createPasswordSession(), {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookieMaxAge(),
  });
  return response;
}

function redirectWithError(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}
