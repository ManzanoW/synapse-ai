import type { Metadata } from "next";
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
      <body className="antialiased font-sans bg-[#030712] text-slate-100 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {children}
      </body>
    </html>
  );
}
