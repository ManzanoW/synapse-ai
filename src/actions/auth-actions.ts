"use server";

import { signIn, signOut } from "@/auth";
import { cookies, headers } from "next/headers";

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

/**
 * Structured details extracted from an authentication or server action error.
 */
export interface AuthErrorInfo {
  timestamp: string;
  actionName: string;
  category:
    | "SERVER_ACTION_NOT_FOUND"
    | "AUTH_PROVIDER_ERROR"
    | "NETWORK_ERROR"
    | "SESSION_ERROR"
    | "UNKNOWN";
  errorCode?: string;
  errorDigest?: string;
  actionId?: string;
  message: string;
  hint?: string;
  context?: Record<string, unknown>;
}

/**
 * Checks if an error thrown by Next.js is a redirect exception.
 * In Next.js Server Actions, successful redirects (like signIn's redirectTo)
 * work by throwing a special error object with a NEXT_REDIRECT digest.
 */
function isRedirectError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "digest" in error) {
    const digest = (error as { digest?: unknown }).digest;
    return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
  }
  return false;
}

/**
 * Logging helper that captures specific authentication and Next.js server action errors.
 * Diagnoses 404 'Failed to find Server Action' errors, stale action hashes, and OAuth failures.
 */
export async function logAuthActionError(
  actionName: string,
  error: unknown,
  context: Record<string, unknown> = {}
): Promise<AuthErrorInfo | null> {
  // Ignore normal Next.js redirects (they throw NEXT_REDIRECT to navigate)
  if (isRedirectError(error)) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorObj =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const errorDigest =
    typeof errorObj.digest === "string" ? errorObj.digest : undefined;
  const errorCode =
    typeof errorObj.code === "string"
      ? errorObj.code
      : typeof errorObj.name === "string"
      ? errorObj.name
      : undefined;

  // Detect 404 "Failed to find Server Action" errors
  const isActionNotFound =
    errorMessage.includes("Failed to find Server Action") ||
    errorDigest?.includes("NEXT_ACTION_NOT_FOUND") ||
    errorCode === "NEXT_ACTION_NOT_FOUND";

  let actionId: string | undefined;
  if (isActionNotFound) {
    const match = errorMessage.match(/Failed to find Server Action "([a-zA-Z0-9_-]+)"/i);
    if (match?.[1]) {
      actionId = match[1];
    }
  }

  // Inspect headers if available to capture client state, origin, and next-action ID
  const headerDetails: Record<string, string | null> = {};
  try {
    const reqHeaders = await headers();
    headerDetails.nextAction = reqHeaders.get("next-action");
    headerDetails.host = reqHeaders.get("host");
    headerDetails.referer = reqHeaders.get("referer");
    headerDetails.origin = reqHeaders.get("origin");
    headerDetails.userAgent = reqHeaders.get("user-agent");

    if (!actionId && headerDetails.nextAction) {
      actionId = headerDetails.nextAction;
    }
  } catch {
    // headers() might not be available in all runtime contexts
  }

  // Categorize and provide diagnostic hints
  let category: AuthErrorInfo["category"] = "UNKNOWN";
  let hint: string | undefined;

  if (isActionNotFound) {
    category = "SERVER_ACTION_NOT_FOUND";
    hint =
      "404 Server Action Not Found: The client invoked an action hash that does not match the active server build manifest. " +
      "This commonly occurs when a browser tab was loaded prior to a new deployment or hot-rebuild. " +
      "Resolution: The client should trigger a full page reload or use a direct route handler.";
  } else if (
    errorMessage.toLowerCase().includes("oauth") ||
    errorMessage.toLowerCase().includes("jwks") ||
    errorMessage.toLowerCase().includes("fetch failed") ||
    errorCode?.startsWith("OAuth")
  ) {
    category = "AUTH_PROVIDER_ERROR";
    hint = "OAuth Provider Error: Failed to communicate with the OAuth provider. Verify OAuth client ID/secret and network.";
  } else if (
    errorMessage.toLowerCase().includes("econnrefused") ||
    errorMessage.toLowerCase().includes("timeout") ||
    errorMessage.toLowerCase().includes("network")
  ) {
    category = "NETWORK_ERROR";
    hint = "Network Error: Transient timeout or unreachable connection during authentication.";
  } else if (
    errorMessage.toLowerCase().includes("session") ||
    errorMessage.toLowerCase().includes("jwt") ||
    errorMessage.toLowerCase().includes("jwe")
  ) {
    category = "SESSION_ERROR";
    hint = "Session Error: Session mismatch or unreadable token cookie.";
  }

  const errorInfo: AuthErrorInfo = {
    timestamp,
    actionName,
    category,
    errorCode,
    errorDigest,
    actionId,
    message: errorMessage,
    hint,
    context: {
      ...headerDetails,
      ...context,
    },
  };

  console.error(
    `[Auth Error Diagnostic][${category}] ${actionName}: ${errorMessage} (ActionId: ${actionId || "N/A"})`,
    JSON.stringify(errorInfo, null, 2)
  );

  return errorInfo;
}

/**
 * Executes an authentication operation with exponential backoff retry.
 * Handles transient network dropouts, provider timeout spikes, and session mismatches.
 */
async function executeAuthWithRetry<T>(
  actionName: string,
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 200, backoffFactor = 2 } = options;
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    attempt++;
    try {
      return await operation();
    } catch (error) {
      // Successful Auth.js / Next.js redirection throws NEXT_REDIRECT - always rethrow immediately
      if (isRedirectError(error)) {
        throw error;
      }

      const isLastAttempt = attempt >= maxRetries;

      // Log detailed error telemetry with diagnostics
      await logAuthActionError(actionName, error, {
        attempt,
        maxRetries,
        isLastAttempt,
      });

      if (isLastAttempt) {
        console.error(
          `[Auth Retry] ${actionName} failed permanently after ${maxRetries} attempts.`
        );
        throw error;
      }

      // Exponential backoff before next attempt
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }
}

/**
 * Resolves an absolute URL for redirects in standalone output / container environments.
 * Uses x-forwarded-host, x-forwarded-proto, or AUTH_URL/NEXTAUTH_URL environment variables
 * to ensure redirects retain full host and protocol context behind reverse proxies.
 */
export async function getAbsoluteRedirectUrl(path: string): Promise<string> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const headersList = await headers();
    const forwardedHost =
      headersList.get("x-forwarded-host") || headersList.get("host");
    const forwardedProto =
      headersList.get("x-forwarded-proto") ||
      (forwardedHost && !forwardedHost.includes("localhost")
        ? "https"
        : "http");

    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}${cleanPath}`;
    }
  } catch {
    // headers() might fail in some contexts, fall back to environment variables
  }

  // Em ambiente Vercel Preview, prioriza SEMPRE a URL dinâmica da branch (VERCEL_URL)
  if (process.env.VERCEL_URL && (process.env.VERCEL_ENV === "preview" || !process.env.AUTH_URL)) {
    return `https://${process.env.VERCEL_URL}${cleanPath}`;
  }

  const envBase =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (envBase) {
    const base = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
    return `${base}${cleanPath}`;
  }

  // Fallback to clean path if host context cannot be resolved
  return cleanPath;
}

export async function loginWithGoogle(callbackUrl: string = "/dashboard") {
  const redirectTo = await getAbsoluteRedirectUrl(callbackUrl);
  return executeAuthWithRetry("loginWithGoogle", async () => {
    await signIn("google", { redirectTo });
  });
}

export async function loginWithGithub(callbackUrl: string = "/dashboard") {
  const redirectTo = await getAbsoluteRedirectUrl(callbackUrl);
  return executeAuthWithRetry("loginWithGithub", async () => {
    await signIn("github", { redirectTo });
  });
}

export async function loginAsGuest() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("synapse_demo_active", "true", {
      path: "/",
      sameSite: "none",
      secure: true,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch (err) {
    console.warn("Could not set demo cookie:", err);
  }

  const redirectTo = await getAbsoluteRedirectUrl("/dashboard?demo=true");
  await signIn("credentials", {
    email: "estudante@synapse.ai",
    redirectTo,
  });
}

export async function logoutAction() {
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

  try {
    const cookieStore = await cookies();
    for (const name of sessionCookieNames) {
      try {
        cookieStore.delete(name);
        cookieStore.set(name, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      } catch (cookieErr) {
        console.warn(`Could not clear cookie ${name}:`, cookieErr);
      }
    }
  } catch (err) {
    console.warn("Could not access cookies in logoutAction:", err);
  }

  try {
    await signOut({ redirect: false });
  } catch (err) {
    if (!isRedirectError(err)) {
      console.warn("signOut error in logoutAction:", err);
    }
  }

  return { success: true };
}
