import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";
import { GamificationProvider } from "@/context/GamificationContext";
import { AchievementProvider } from "@/context/AchievementContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { CommandPalette } from "@/components/ui/command-palette";
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
          <AudioProvider>
            <div className="flex h-screen w-full bg-[#030712] overflow-hidden">
              {/* Paleta de Comandos Global (Cmd+K / Ctrl+K) */}
              <CommandPalette />

              {/* Sidebar Desktop */}
              <Sidebar user={session.user} />

              {/* Área principal com margem inferior para o menu mobile */}
              <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                {children}
              </main>

              {/* Navegação Inferior Mobile */}
              <BottomNavigation />
            </div>
          </AudioProvider>
        </AchievementProvider>
      </GamificationProvider>
    </SidebarProvider>
  );
}
