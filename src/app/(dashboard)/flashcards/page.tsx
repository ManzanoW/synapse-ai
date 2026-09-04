import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/auth";
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
  Lock,
} from "lucide-react";

export default async function FlashcardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const totalSubjects = await prisma.subject.count({
    where: { userId },
  });

  const totalDecks = await prisma.deck.count({
    where: { userId },
  });

  const totalCards = await prisma.flashcard.count({
    where: {
      deck: { userId },
    },
  });

  const dueCardsCount = await prisma.flashcard.count({
    where: {
      deck: { userId },
      OR: [
        { nextReviewDate: { lte: new Date() } },
        {
          topic: {
            nextRev: { lte: new Date() },
          },
        },
      ],
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

  const estimatedRetention = totalCards > 0 ? "88.5%" : "100%";
  const streakDays: number = 0;

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto text-slate-100 space-y-6 sm:space-y-8 selection:bg-indigo-500/30 font-sans pb-16">
      {totalSubjects === 0 ? (
        <div className="min-h-[65vh] flex items-center justify-center py-4">
          <div className="relative overflow-hidden max-w-xl w-full bg-gradient-to-b from-[#0c101d] via-[#080b14] to-[#04060c] border border-amber-500/30 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-5">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 relative z-10">
              <BookOpen size={26} />
            </div>
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                <Lock size={12} /> Etapa Obrigatória
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Configure seu Edital Primeiro
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                Para a inteligência artificial sincronizar tópicos e gerar
                baralhos de repetição espaçada, é necessário mapear o seu edital
                primeiro.
              </p>
            </div>
            <div className="pt-2 relative z-10">
              <Link
                href="/edital"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
              >
                <BookOpen size={15} />
                <span>Cadastrar Edital Agora</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* HERO BANNER */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
              <div className="space-y-3 max-w-2xl w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                  <Zap
                    size={13}
                    className="fill-indigo-400 animate-pulse text-indigo-400"
                  />
                  <span>Sessão de Hoje Disponível</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Pronto para reforçar sua{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                    memória?
                  </span>
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Você possui{" "}
                  <strong className="text-indigo-300 font-bold">
                    {dueCardsCount}{" "}
                    {dueCardsCount === 1 ? "flashcard" : "flashcards"}
                  </strong>{" "}
                  prontos para revisão hoje pelo algoritmo SM-2.
                </p>

                <div className="pt-1 flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mb-1.5 font-medium">
                      <span>Meta diária</span>
                      <span className="text-indigo-400 font-bold">
                        {Math.min(dueCardsCount, 20)} / 20 cards
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-sm shadow-indigo-500/50 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (dueCardsCount / 20) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
                {totalCards > 0 ? (
                  <Link
                    href="/flashcards/study/all"
                    className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/30 cursor-pointer w-full sm:w-auto"
                  >
                    <Zap
                      size={16}
                      className="fill-white group-hover:scale-110 transition-transform"
                    />
                    <span>Iniciar Revisão Geral</span>
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                ) : (
                  <Link
                    href="/flashcards/decks?openModal=true"
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer w-full sm:w-auto"
                  >
                    <Plus size={18} />
                    <span>Criar Primeiro Baralho</span>
                  </Link>
                )}

                <Link
                  href="/flashcards/decks"
                  className="inline-flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 text-xs font-semibold px-5 py-3 rounded-xl border border-slate-800/80 transition-colors w-full sm:w-auto"
                >
                  <Layers size={15} />
                  <span>Gerenciar Coleções ({totalDecks})</span>
                </Link>
              </div>
            </div>
          </div>

          {/* PAINEL DE PERFORMANCE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Flame
                    size={16}
                    className="text-amber-400 fill-amber-400/20"
                  />
                  Ofensiva
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {streakDays} {streakDays === 1 ? "dia" : "dias"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1 overflow-x-auto scrollbar-none py-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (day, idx) => {
                    const isActive =
                      streakDays > 0 && idx < Math.min(streakDays, 7);
                    return (
                      <div
                        key={day}
                        className="flex flex-col items-center gap-1.5 shrink-0"
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs transition-all ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                              : "bg-slate-950/80 text-slate-700 border border-slate-800"
                          }`}
                        >
                          {isActive && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {day}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Target size={16} className="text-emerald-400" />
                  Taxa de Retenção
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={12} /> SM-2
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1">
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {estimatedRetention}
                </p>
                <span className="text-[11px] text-slate-400">
                  Domínio da memória
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-normal">
                Você possui{" "}
                <strong className="text-slate-300">{totalCards} cards</strong>{" "}
                cadastrados.
              </p>
            </div>

            <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 rounded-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group sm:col-span-2 lg:col-span-1">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles size={15} className="animate-pulse" />
                  <span>Gerador com IA</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Criar Cards do Edital
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transforme tópicos da sua disciplina em conjuntos de repetição
                  em segundos.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/flashcards/decks?openModal=true"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span>Gerar via IA</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* SESSÃO: BARALHOS PRIORITÁRIOS */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={17} className="text-indigo-400" />
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Revisões Prioritárias
                </h2>
              </div>
              <Link
                href="/flashcards/decks"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
              >
                <span>Ver todos ({totalDecks})</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {recentDecks.length === 0 ? (
              <div className="p-8 sm:p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                <Layers size={36} className="mx-auto text-slate-600 mb-2" />
                <h3 className="text-slate-300 font-semibold text-sm mb-1">
                  Nenhum baralho cadastrado
                </h3>
                <p className="text-slate-500 text-xs mb-4 max-w-sm mx-auto">
                  Crie seu primeiro conjunto para ativar a repetição espaçada.
                </p>
                <Link
                  href="/flashcards/decks?openModal=true"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
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
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl transition-all duration-200 hover:bg-slate-900/70 gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <BookOpen size={18} className="sm:w-5 sm:h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md truncate max-w-[140px]">
                              {subjectName}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {count} {count === 1 ? "card" : "cards"}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-100 text-sm sm:text-base truncate group-hover:text-indigo-300 transition-colors">
                            {deck.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-emerald-400 font-bold block">
                            Pronto para revisar
                          </span>
                          <span className="text-[9px] text-slate-500">
                            SM-2 Ativo
                          </span>
                        </div>

                        <Link
                          href={`/flashcards/study/${deck.id}`}
                          className="flex items-center justify-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer w-full sm:w-auto"
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
        </>
      )}
    </div>
  );
}
