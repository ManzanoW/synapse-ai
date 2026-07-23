import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";
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
      {/* h-screen e overflow-hidden no pai travam a janela inteira */}
      <div className="flex h-screen w-full bg-[#030712] overflow-hidden">
        {/* Sidebar fixa à esquerda recebendo o usuário autenticado */}
        <Sidebar user={session.user} />

        {/* O <main> com flex-1, h-full e overflow-y-auto para rolar sozinho */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
