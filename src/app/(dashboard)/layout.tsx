import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";
import { GamificationProvider } from "@/context/GamificationContext";
import { AchievementProvider } from "@/context/AchievementContext"; // 👈 Importe o novo provider
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <GamificationProvider userId={session?.user?.id}>
        <AchievementProvider>
          {" "}
          {/* 👈 Envolva a aplicação aqui */}
          <div className="flex h-screen w-full bg-[#030712] overflow-hidden">
            {/* Sidebar fixa ocupando 100% da altura */}
            <Sidebar user={session.user} />

            {/* Área principal livre de headers */}
            <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </AchievementProvider>
      </GamificationProvider>
    </SidebarProvider>
  );
}
