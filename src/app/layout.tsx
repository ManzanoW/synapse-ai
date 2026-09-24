import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/contexts/AudioContext";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="pt-BR" className={`${sansFont.variable} ${monoFont.variable}`}>
      <body className={`${sansFont.className} antialiased font-sans bg-[#030712] text-slate-100 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900`}>
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
