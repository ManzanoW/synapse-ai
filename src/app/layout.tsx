import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/lib/sidebar-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse AI - Seu Copiloto de Estudos",
  description: "Plataforma inteligente de memorização e cronogramas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans bg-[#030712] text-slate-100 overflow-hidden">
        {/* O Provider embrulha todo mundo e distribui os comandos do menu */}
        <SidebarProvider>
          <div className="flex h-screen w-screen overflow-hidden relative">
            
            <Sidebar />

            <main className="flex-1 h-full overflow-y-auto bg-[#030712]">
              {children}
            </main>

          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}