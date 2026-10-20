// src/app/share/deck/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublicDeckAction } from "@/actions/share-actions";
import { PublicDeckViewer } from "@/components/share/PublicDeckViewer";

interface ShareDeckPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ShareDeckPageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getPublicDeckAction(id);

  if (!res.success || !res.data) {
    return {
      title: "Baralho Não Encontrado | Synapse AI",
      description: "O baralho compartilhado não foi encontrado ou expirou.",
    };
  }

  const deck = res.data;
  const title = `Baralho: ${deck.title} (${deck.totalCards} Flashcards) | Synapse AI`;
  const description = `Estude este baralho de flashcards sobre ${deck.subjectName || "concursos"} com repetição inteligente e Inteligência Artificial no Synapse AI.`;

  return {
    title,
    description,
    authors: [{ name: deck.author.name }],
    keywords: [
      "concursos",
      "flashcards",
      "repetição inteligente",
      "memorização",
      deck.subjectName || "estudos",
      deck.title,
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

export default async function ShareDeckPage({ params }: ShareDeckPageProps) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const res = await getPublicDeckAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <PublicDeckViewer deck={res.data} isLoggedIn={isLoggedIn} />;
}
