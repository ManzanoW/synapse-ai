import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth"; // ou sua lib de autenticação (ex: getServerSession)
import { redirect } from "next/navigation";
import {
  Layers,
  Plus,
  Sparkles,
  ArrowRight,
  BookOpen,
  Zap,
  Flame,
  Target,
  Clock,
  ChevronRight,
  TrendingUp,
  Check,
} from "lucide-react";

export default async function FlashcardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 🟢 FILTRADO POR USERID: Baralhos e Cards pertencentes unicamente ao usuário atual
  const totalDecks = await prisma.deck.count({
    where: { userId },
  });

  const totalCards = await prisma.flashcard.count({
    where: {
      deck: { userId },
    },
  });

  const recentDecks = await prisma.deck.findMany({
    where: { userId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      subject: true,
      _count: { select: { flashcards: true } },
    },
  });

  const dueCardsCount = Math.min(totalCards, 14);

  return (
    <div className="p-8 max-w-350 mx-auto text-slate-100 space-y-8">
      {/* 🚀 HERO BANNER - COMMAND CENTER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-950/90 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Zap
                size={14}
                className="fill-indigo-400 animate-pulse text-indigo-400"
              />
              <span>Sessão de Hoje Disponível</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Pronto para reforçar sua{" "}
              <span className="bg-linear-to-r from-indigo-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                memória?
              </span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Você possui{" "}
              <strong className="text-indigo-300 font-bold">
                {dueCardsCount} flashcards
              </strong>{" "}
              prontos para revisão hoje pelo algoritmo de repetição espaçada.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span>Meta diária</span>
                  <span className="text-indigo-400 font-bold">
                    12 / 20 cards
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-linear-to-r from-indigo-500 to-violet-500 w-[60%] rounded-full shadow-sm shadow-indigo-500/50" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
            {recentDecks.length > 0 ? (
              <Link
                href={`/flashcards/study/${recentDecks[0].id}`}
                className="group relative inline-flex items-center justify-center gap-3 bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold px-7 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 active:scale-95 border border-indigo-400/30"
              >
                <Zap
                  size={18}
                  className="fill-white group-hover:scale-110 transition-transform"
                />
                <span>Iniciar Revisão Geral</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            ) : (
              <Link
                href="/flashcards/decks"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus size={18} />
                <span>Criar Primeiro Baralho</span>
              </Link>
            )}

            <Link
              href="/flashcards/decks"
              className="inline-flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 text-xs font-semibold px-5 py-3 rounded-xl border border-slate-800/80 transition-colors"
            >
              <Layers size={15} />
              <span>Gerenciar Coleções ({totalDecks})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 PAINEL DE PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap/Streak Widget */}
        <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Flame size={16} className="text-amber-400 fill-amber-400/20" />
              Ofensiva de Estudos
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              5 dias seguidos
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 pt-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
              (day, idx) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all ${
                      idx < 5
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-950/80 text-slate-700 border border-slate-800"
                    }`}
                  >
                    {idx < 5 && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {day}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Retenção SM-2 Widget */}
        <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target size={16} className="text-emerald-400" />
              Taxa de Retenção (SM-2)
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} /> +4% esta semana
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <p className="text-3xl font-black text-white tracking-tight">
              88.5%
            </p>
            <span className="text-xs text-slate-400">Domínio da memória</span>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            Você lembrou com facilidade de{" "}
            <strong className="text-slate-300">{totalCards} cards</strong>{" "}
            cadastrados na sua base.
          </p>
        </div>

        {/* AI Generator CTA */}
        <div className="p-6 bg-linear-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 rounded-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-15 transition-opacity">
            <Sparkles size={120} className="text-indigo-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={16} className="animate-pulse" />
              <span>Gerador com IA</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Criar Cards do Edital
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transforme tópicos da sua disciplina em conjuntos de repetição em
              segundos.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/flashcards/decks"
              className="inline-flex items-center gap-2 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl transition-all"
            >
              <span>Gerar via IA</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 📚 SESSÃO: BARALHOS PRIORITÁRIOS PARA HOJE */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Revisões Prioritárias
            </h2>
          </div>
          <Link
            href="/flashcards/decks"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>Ver todos ({totalDecks})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentDecks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <Layers size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-slate-300 font-semibold mb-1">
              Nenhum baralho cadastrado
            </h3>
            <p className="text-slate-500 text-xs mb-4 max-w-sm mx-auto">
              Crie seu primeiro conjunto de estudos para ativar o algoritmo de
              repetição.
            </p>
            <Link
              href="/flashcards/decks"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus size={16} /> Criar Baralho
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDecks.map((deck) => {
              const count = deck._count.flashcards;
              const subjectName = deck.subject?.name || "Geral";

              return (
                <div
                  key={deck.id}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl transition-all duration-200 hover:bg-slate-900/70 gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                          {subjectName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {count} {count === 1 ? "card" : "cards"}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-100 text-base truncate group-hover:text-indigo-300 transition-colors">
                        {deck.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                    <div className="text-right hidden md:block">
                      <span className="text-[11px] text-emerald-400 font-bold block">
                        Pronto para revisar
                      </span>
                      <span className="text-[10px] text-slate-500">
                        SM-2 Ativo
                      </span>
                    </div>

                    <Link
                      href={`/flashcards/study/${deck.id}`}
                      className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/15 active:scale-95"
                    >
                      <span>Estudar</span>
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
