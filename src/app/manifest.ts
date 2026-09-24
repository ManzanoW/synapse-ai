import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Synapse AI - Preparação Inteligente para Concursos",
    short_name: "Synapse AI",
    description:
      "Plataforma inteligente para concursos públicos com IA pedagógica, simulados de bancas reais, OCR de redação e repetição espaçada FSRS.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#060810",
    theme_color: "#4f46e5",
    categories: ["education", "productivity"],
    lang: "pt-BR",
    icons: [
      {
        src: "/Synapse-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/Synapse-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
