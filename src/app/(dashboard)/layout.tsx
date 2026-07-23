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

  // Se tentar renderizar qualquer página do grupo (dashboard) sem sessão, manda pro login
  if (!session) {
    redirect("/login");
  }

  return (
    // Seus providers e componentes do Dashboard aqui
    <SidebarProvider>
      <Sidebar />
      <main>{children}</main>
    </SidebarProvider>
  );
}
