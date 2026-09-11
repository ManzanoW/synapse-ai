"use server";

import { signIn, signOut } from "@/auth";
import { cookies } from "next/headers";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function loginWithGithub() {
  await signIn("github", { redirectTo: "/dashboard" });
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

  await signIn("credentials", {
    email: "estudante@synapse.ai",
    redirectTo: "/dashboard",
  });
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("synapse_demo_active");
  } catch (err) {
    console.warn("Could not clear demo cookie:", err);
  }
  await signOut({ redirectTo: "/login" });
}
