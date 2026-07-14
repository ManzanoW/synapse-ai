import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Layers } from "lucide-react";

export default async function FlashcardsPage() {
  // 1. Buscamos as estatísticas
  const totalDecks = await prisma.deck.count();
  const totalCards = await prisma.flashcard.count();

  // 2. Buscamos os 3 últimos decks criados
  const recentDecks = await prisma.deck.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { flashcards: true } } },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto text-slate-100">
      <h1 className="text-2xl font-bold mb-2">Central de Flashcards</h1>
      <p className="text-slate-500 mb-8">
        Acompanhe seu progresso e acesse seus estudos recentes.
      </p>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="p-6 bg-[#090d16] border border-slate-800 rounded-2xl">
          <h2 className="text-sm font-medium text-slate-400">Total de Decks</h2>
          <p className="text-4xl font-bold text-white mt-2">{totalDecks}</p>
        </div>
        <div className="p-6 bg-[#090d16] border border-slate-800 rounded-2xl">
          <h2 className="text-sm font-medium text-slate-400">Total de Cards</h2>
          <p className="text-4xl font-bold text-indigo-500 mt-2">
            {totalCards}
          </p>
        </div>
      </div>

      {/* Lista de Recentes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Últimos Decks</h2>
          <Link
            href="/flashcards/decks"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid gap-3">
          {recentDecks.map((deck) => (
            <div
              key={deck.id}
              className="flex items-center justify-between p-4 bg-[#090d16] border border-slate-800 rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <Layers size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold">{deck.title}</h3>
                  <p className="text-xs text-slate-500">
                    {deck._count.flashcards} cards
                  </p>
                </div>
              </div>
              <Link
                href={`/flashcards/study/${deck.id}`}
                className="text-xs font-bold border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                Estudar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
