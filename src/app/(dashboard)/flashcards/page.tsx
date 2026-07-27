import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Layers,
  Plus,
  Sparkles,
  ArrowRight,
  BookOpen,
  BrainCircuit,
} from "lucide-react";

export default async function FlashcardsPage() {
  const totalDecks = await prisma.deck.count();
  const totalCards = await prisma.flashcard.count();

  const recentDecks = await prisma.deck.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { flashcards: true } } },
  });

  return (
    <div className="p-8 max-w-350 mx-auto text-slate-100 space-y-10">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Repetição Espaçada
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Central de Flashcards
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Fortaleça sua memória de longo prazo e acompanhe o domínio dos seus
            temas.
          </p>
        </div>
      </div>

      {/* Grid de Estatísticas Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="relative group overflow-hidden p-6 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl backdrop-blur-xl transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers size={90} className="text-indigo-400" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 mb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Layers size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Baralhos Ativos
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-white tracking-tight">
              {totalDecks}
            </p>
            <span className="text-xs text-slate-500 font-medium">
              coleções criadas
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative group overflow-hidden p-6 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl backdrop-blur-xl transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BrainCircuit size={90} className="text-indigo-400" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 mb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <BrainCircuit size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total de Cards
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-indigo-400 tracking-tight">
              {totalCards}
            </p>
            <span className="text-xs text-slate-500 font-medium">
              cards cadastrados
            </span>
          </div>
        </div>

        {/* Action Card IA */}
        <div className="relative overflow-hidden p-6 bg-linear-to-br from-indigo-950/30 via-slate-900/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={16} className="animate-pulse" />
              <span>Criação Inteligente</span>
            </div>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Gere dezenas de flashcards focados nos pontos mais cobrados do seu
              edital usando IA.
            </p>
          </div>
          <div className="mt-4 pt-3">
            <Link
              href="/flashcards/decks"
              className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold group transition-colors"
            >
              <span>Gerar com Inteligência Artificial</span>
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1.5 transition-transform duration-200"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Lista de Baralhos */}
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <BookOpen size={20} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Baralhos Recentes
            </h2>
          </div>
          <Link
            href="/flashcards/decks"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
          >
            <span>Ver todos ({totalDecks})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentDecks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Layers size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-slate-300 font-semibold mb-1">
              Nenhum baralho criado ainda
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Crie seu primeiro deck para iniciar as sessões de memorização.
            </p>
            <Link
              href="/flashcards/decks"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={16} /> Criar Baralho
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentDecks.map((deck) => {
              const count = deck._count.flashcards;
              return (
                <div
                  key={deck.id}
                  className="group relative flex flex-col justify-between p-6 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  {/* Topo do Baralho */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 bg-linear-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                        <Layers size={22} />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-3 py-1 bg-slate-800/80 text-slate-300 rounded-full border border-slate-700/60 shadow-inner">
                          {count} {count === 1 ? "card" : "cards"}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base line-clamp-1 mb-2 group-hover:text-indigo-300 transition-colors">
                      {deck.title}
                    </h3>
                  </div>

                  {/* Ação do Baralho */}
                  <div className="mt-6 pt-4 border-t border-slate-800/60">
                    <Link
                      href={`/flashcards/study/${deck.id}`}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/15 active:scale-95"
                    >
                      <span>Estudar Baralho</span>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
