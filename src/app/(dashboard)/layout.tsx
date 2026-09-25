import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";
import { GamificationProvider } from "@/context/GamificationContext";
import { AchievementProvider } from "@/context/AchievementContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { CommandPalette } from "@/components/ui/command-palette";
import { DemoSessionSync } from "@/components/auth/demo-session-sync";
import { SoundscapeFloatingWidget } from "@/components/audio/SoundscapeFloatingWidget";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          careerFocus: true,
          targetRole: true,
          planTier: true,
          role: true,
          email: true,
        },
      })
    : null;

  const isAdmin =
    dbUser?.role === "ADMIN" ||
    Boolean(
      (dbUser?.email || session?.user?.email) &&
        process.env.ADMIN_EMAIL &&
        (dbUser?.email || session?.user?.email)!.toLowerCase() ===
          process.env.ADMIN_EMAIL.toLowerCase(),
    );

  const isPro =
    dbUser?.planTier === "PREMIUM" ||
    isAdmin;

  return (
    <SidebarProvider>
      <DemoSessionSync />
      <GamificationProvider userId={session?.user?.id}>
        <AchievementProvider>
          <AudioProvider>
            <div className="flex h-screen h-[100dvh] w-full bg-[#030712] overflow-hidden relative">
              {/* Mini-HUD de Áudio Zen & Foco Global */}
              <SoundscapeFloatingWidget />

              {/* Paleta de Comandos Global (Cmd+K / Ctrl+K) */}
              <CommandPalette />

              {/* Sidebar Desktop */}
              <Sidebar
                user={{
                  ...session.user,
                  careerFocus: dbUser?.careerFocus,
                  targetRole: dbUser?.targetRole,
                  planTier: dbUser?.planTier,
                  role: dbUser?.role,
                  isPro,
                  isAdmin,
                }}
              />

              {/* Área principal com margem inferior para o menu mobile */}
              <main className="flex-1 min-w-0 h-full overflow-y-auto p-3 sm:p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:pb-6">
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
