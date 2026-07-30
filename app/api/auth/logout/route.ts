import { NextResponse } from "next/server";
import { sessionCookieName } from "@/app/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, expires: new Date(0), path: "/", sameSite: "lax" });
  return response;
}

export const POST = GET;
