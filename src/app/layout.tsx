import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/contexts/AudioContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

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

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Synapse AI • Estudos de Alta Performance",
  description: "Plataforma inteligente de estudos, memorização espaçada, cronogramas e simulados com IA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Synapse AI",
  },
  icons: {
    icon: "/Synapse-icon.png",
    apple: "/Synapse-icon.png",
  },
  openGraph: {
    title: "Synapse AI • Concursos & Alta Performance",
    description: "Plataforma inteligente de estudos, memorização espaçada, cronogramas e simulados com IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sansFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem("synapse-theme");
                if (stored === "light") {
                  document.documentElement.classList.add("light");
                  document.documentElement.setAttribute("data-theme", "light");
                  document.documentElement.style.colorScheme = "light";
                } else {
                  document.documentElement.classList.add("dark");
                  document.documentElement.setAttribute("data-theme", "dark");
                  document.documentElement.style.colorScheme = "dark";
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${sansFont.className} antialiased font-sans transition-colors duration-200 bg-[#030712] text-slate-100 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900`}>
        <ThemeProvider>
          <AudioProvider>{children}</AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
