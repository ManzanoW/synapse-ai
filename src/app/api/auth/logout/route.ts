import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function POST() {
  const sessionCookieNames = [
    "synapse_demo_active",
    "synapse-demo-session",
    "auth_token",
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
  ];

  const response = NextResponse.json({ success: true, redirectUrl: "/login" });

  for (const cookieName of sessionCookieNames) {
    try {
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } catch {
      // Ignora falhas individuais na exclusao
    }
  }

  try {
    await signOut({ redirect: false });
  } catch {
    // Ignora redirecionamento ou falha interna do signOut
  }

  return response;
}
