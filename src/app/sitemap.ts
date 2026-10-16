import { MetadataRoute } from "next";
import { PRESET_MINDMAPS } from "@/lib/mindmap-presets";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://synapseconcursos.com.br";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const presetMindmapRoutes: MetadataRoute.Sitemap = PRESET_MINDMAPS.map((m) => ({
    url: `${baseUrl}/share/mapa/${m.id}`,
    lastModified: new Date(m.createdAt || new Date()),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...presetMindmapRoutes];
}
