import { prisma } from "@/lib/prisma";
import StudyFlashcard from "@/components/flashcards/StudyFlashcard";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

interface StudyPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ filter?: string; mode?: string }>;
}

export default async function StudyPage({
  params,
  searchParams,
}: StudyPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isDueOnly =
    resolvedSearchParams.filter === "due" ||
    resolvedSearchParams.mode === "due";
  const now = new Date();

  // CASO 1: REVISÃO GERAL OU FILTRADA POR VENCIDOS
  if (id === "all") {
    const flashcards = await prisma.flashcard.findMany({
      where: {
        deck: { userId: session.user.id },
        ...(isDueOnly ? { nextReviewDate: { lte: now } } : {}),
      },
      orderBy: [
        { nextReviewDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (isDueOnly && flashcards.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[85vh] p-4 font-sans">
          <div className="w-full max-w-md p-8 bg-slate-900/80 border border-emerald-500/30 rounded-3xl backdrop-blur-2xl text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-xl font-black text-white">
              Memória 100% em Dia! 🎉
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed max-w-xs mx-auto">
              Nenhum flashcard está vencido para hoje. O algoritmo FSRS agendou os próximos ciclos para o momento exato da curva de esquecimento.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/flashcards/study/all"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Estudar Acervo Completo</span>
              </Link>
              <Link
                href="/flashcards"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs transition-all border border-white/10 active:scale-95 cursor-pointer"
              >
                <span>Voltar</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <StudyFlashcard
        deckTitle={isDueOnly ? "Revisão FSRS de Hoje" : "Revisão Geral FSRS"}
        cards={flashcards}
        deckId="all"
      />
    );
  }

  // CASO 2: BARALHO ESPECÍFICO
  const deck = await prisma.deck.findUnique({
    where: { id },
    include: {
      flashcards: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] p-4 font-sans">
        <div className="w-full max-w-md p-8 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-2xl text-center space-y-4 shadow-2xl relative overflow-hidden">
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
