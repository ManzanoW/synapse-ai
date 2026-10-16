// src/app/share/mapa/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublicMindmapAction } from "@/actions/share-actions";
import { PublicMindmapViewer } from "@/components/share/PublicMindmapViewer";

interface ShareMindmapPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ShareMindmapPageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getPublicMindmapAction(id);

  if (!res.success || !res.data) {
    return {
      title: "Mapa Mental Não Encontrado | Synapse AI",
      description: "O mapa mental compartilhado não foi encontrado ou expirou.",
    };
  }

  const mm = res.data;
  const title = `Mapa Mental: ${mm.title} (${mm.subject}) | Synapse AI`;
  const description = mm.summary || `Esquematização neural interativa de ${mm.title} com modo Active Recall e IA no Synapse AI.`;

  return {
    title,
    description,
    keywords: [
      "mapa mental",
      "concursos",
      "active recall",
      "memorização",
      mm.subject,
      mm.title,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Synapse AI",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ShareMindmapPage({
  params,
}: ShareMindmapPageProps) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const res = await getPublicMindmapAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <PublicMindmapViewer mindmap={res.data} isLoggedIn={isLoggedIn} />;
}
