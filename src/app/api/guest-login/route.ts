import { NextRequest, NextResponse } from "next/server";
import {
  TokenBucketRateLimiter,
  getClientIdentifier,
  checkRateLimitAndGenerateResponse,
} from "@/lib/rate-limiter";

// Rate limiter específico para rota de autenticação de demonstração
// Permite até 10 requisições simultâneas em burst e repõe 20 requisições por minuto
const guestLoginLimiter = new TokenBucketRateLimiter({
  capacity: 10,
  refillTokensPerInterval: 20,
  intervalMs: 60000,
});

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitCheck = checkRateLimitAndGenerateResponse(guestLoginLimiter, clientId);

  if (!rateLimitCheck.allowed && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const response = NextResponse.json(
    {
      success: true,
      redirectUrl: "/dashboard?demo=true",
    },
    {
      headers: rateLimitCheck.headers,
    }
  );

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

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitCheck = checkRateLimitAndGenerateResponse(guestLoginLimiter, clientId);

  if (!rateLimitCheck.allowed && rateLimitCheck.response) {
    return rateLimitCheck.response;
  }

  const response = new NextResponse(null, {
    status: 302,
    headers: {
      Location: "/dashboard?demo=true",
      ...rateLimitCheck.headers,
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

