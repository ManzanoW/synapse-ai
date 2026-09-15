import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    redirectUrl: "/dashboard?demo=true",
  });

  // Define cookie para contextos HTTPS/Iframe e padrão
  response.cookies.set("synapse_demo_active", "true", {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export async function GET() {
  const response = new NextResponse(null, {
    status: 302,
    headers: {
      Location: "/dashboard?demo=true",
    },
  });

  response.cookies.set("synapse_demo_active", "true", {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

