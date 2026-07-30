import { prisma } from "@/lib/prisma";
import StudyFlashcard from "@/components/flashcards/StudyFlashcard";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deck = await prisma.deck.findUnique({
    where: { id },
    include: {
      flashcards: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Tela defensiva de Deck Não Encontrado
  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] p-4">
        <div className="w-full max-w-md p-8 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-2xl text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Layers size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-100">
            Baralho não encontrado
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
            O baralho que você está tentando acessar foi removido ou não existe.
          </p>
          <div className="pt-2">
            <Link
              href="/flashcards/decks"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              <ArrowLeft size={15} /> Voltar para Baralhos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudyFlashcard
      deckTitle={deck.title}
      cards={deck.flashcards}
      deckId={deck.id}
    />
  );
}
