import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://synapseconcursos.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/login",
          "/terms",
          "/privacy",
          "/share/deck/",
          "/share/mapa/",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard",
          "/edital",
          "/week",
          "/calendar",
          "/cards",
          "/flashcards",
          "/quiz",
          "/questions",
          "/redacao",
          "/discursiva/",
          "/mapas-mentais",
          "/notebook",
          "/profile",
          "/prova-oral",
          "/study-room",
          "/leaderboard",
          "/achievements",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
