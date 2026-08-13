import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./performance-client";

export default async function PerformancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AnalyticsClient user={session.user} />;
}
