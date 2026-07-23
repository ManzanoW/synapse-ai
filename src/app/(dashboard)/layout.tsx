import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 h-full overflow-y-auto bg-[#030712]">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
