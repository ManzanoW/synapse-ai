import type { Metadata } from "next";
import "./globals.css";
import { AudioProvider } from "@/contexts/AudioContext";

export const metadata: Metadata = {
  title: "Synapse AI",
  description: "Plataforma inteligente de estudos, memorização espaçada, cronogramas e simulados com IA.",
  openGraph: {
    title: "Synapse AI",
    description: "Plataforma inteligente de estudos, memorização espaçada, cronogramas e simulados com IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans bg-[#030712] text-slate-100 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
