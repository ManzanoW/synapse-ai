import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAdminAiMetricsAction } from "@/actions/admin-ai-actions";
import { AdminAiDashboard } from "./admin-ai-dashboard";

export const metadata = {
  title: "Cockpit de IA & Infraestrutura | Synapse Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  const isAdmin =
    user?.role === "ADMIN" ||
    Boolean(
      user?.email &&
        process.env.ADMIN_EMAIL &&
        user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    );

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const res = await getAdminAiMetricsAction();
  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-rose-400">
        Falha ao carregar métricas de IA do administrador: {res.error}
      </div>
    );
  }

  return <AdminAiDashboard initialMetrics={res.data} />;
}
