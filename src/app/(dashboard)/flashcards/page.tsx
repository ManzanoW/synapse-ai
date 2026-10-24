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
  Brain,
  AlertCircle,
} from "lucide-react";
import { getFlashcardsAnalyticsAction } from "@/actions/flashcard-actions";
import { FlashcardsHeroActions } from "@/components/flashcards/FlashcardsHeroActions";
import { FlashcardsSpotlight } from "@/components/flashcards/FlashcardsSpotlight";
import { StarterEditalSelector } from "@/components/edital/StarterEditalSelector";

export default async function FlashcardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [totalSubjects, totalDecks, recentDecks, analyticsRes, allUserDecks, audioCards] =
    await Promise.all([
      prisma.subject.count({ where: { userId } }),
      prisma.deck.count({ where: { userId } }),
      prisma.deck.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          subject: true,
          _count: { select: { flashcards: true } },
        },
      }),
      getFlashcardsAnalyticsAction(),
      prisma.deck.findMany({
        where: { userId },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
      prisma.flashcard.findMany({
        where: { deck: { userId } },
        take: 30,
        orderBy: { nextReviewDate: "asc" },
        select: { id: true, question: true, answer: true, details: true },
      }),
    ]);

  const analytics = analyticsRes.success && analyticsRes.data
    ? analyticsRes.data
    : {
        totalCards: 0,
        dueTodayCount: 0,
        averageRetention: 100,
        streakDays: 0,
        maturity: {
          newCount: 0,
          learningCount: 0,
          matureCount: 0,
          leechCount: 0,
        },
      };

  const totalCards = analytics.totalCards;
  const dueCardsCount = analytics.dueTodayCount;
  const estimatedRetention = `${analytics.averageRetention}%`;
  const streakDays = analytics.streakDays;

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto text-slate-100 space-y-6 sm:space-y-8 selection:bg-indigo-500/30 font-sans pb-16">
      {totalSubjects === 0 ? (
        <div className="min-h-[65vh] flex items-center justify-center py-4">
          <div className="relative overflow-hidden max-w-3xl w-full bg-gradient-to-b from-[#0c101d] via-[#080b14] to-[#04060c] border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center space-y-3 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
                <BookOpen size={26} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                <Lock size={12} /> Primeiro Passo para Flashcards
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Configure seu Edital ou Escolha um Modelo Pronto
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                Para a inteligência artificial gerar baralhos de repetição espaçada adaptados ao seu concurso, você precisa de matérias cadastradas. Ative um modelo pronto abaixo ou importe seu próprio edital.
              </p>
            </div>

            <div className="relative z-10 pt-2">
              <StarterEditalSelector />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* SPOTLIGHT DICA DE PRIMEIRO ACESSO */}
          <FlashcardsSpotlight />

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
                    {dueCardsCount === 1 ? "cartão" : "cartões"}
                  </strong>{" "}
                  prontos para revisar hoje e não esquecer na prova.
                </p>

                <div className="pt-1 flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mb-1.5 font-medium">
                      <span>Meta diária</span>
                      <span className="text-indigo-400 font-bold">
                        {Math.min(dueCardsCount, 20)} / 20 cartões
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

              <FlashcardsHeroActions
                totalCards={totalCards}
                totalDecks={totalDecks}
                dueCardsCount={dueCardsCount}
                decks={allUserDecks}
                audioCards={audioCards}
              />
            </div>
          </div>

          {/* 1. SESSÃO PRINCIPAL: BARALHOS PRIORITÁRIOS (ACIMA DA DOBRA) */}
          <div className="space-y-4">
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
              <div className="p-8 sm:p-12 text-center bg-slate-900/40 border border-indigo-500/20 rounded-3xl backdrop-blur-xl space-y-4 max-w-xl mx-auto shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-lg shadow-indigo-500/10">
                  <Layers size={28} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-slate-100 font-bold text-base sm:text-lg tracking-tight">
                    Nenhum baralho criado ainda
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                    Os baralhos com repetição inteligente sincronizam seus estudos com a memória de longo prazo, garantindo que os detalhes mais cobrados da sua banca fiquem frescos no dia da prova.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/flashcards/decks?openModal=true"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer min-h-[44px]"
                  >
                    <Plus size={16} />
                    <span>Criar Baralho de Estudo</span>
                  </Link>
                  <Link
                    href="/questions"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/10 active:scale-95 cursor-pointer min-h-[44px]"
                  >
                    <Target size={15} className="text-indigo-400" />
                    <span>Gerar a partir de Questões</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDecks.map((deck: any) => {
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
                              {count} {count === 1 ? "cartão" : "cartões"}
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
                            Revisão Automática
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

          {/* 2. RESUMO COMPACTO DE MEMORIZAÇÃO (1 FAIXA ENXUTA) */}
          <div className="p-4 sm:p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Resumo da Sua Memória ({totalCards} cartões)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                  <Flame size={14} className="fill-amber-400/20" />
                  {streakDays} {streakDays === 1 ? "dia seguido" : "dias seguidos"}
                </span>
                <span className="text-slate-700">•</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {estimatedRetention} retenção média
                </span>
              </div>
            </div>

            {totalCards > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-violet-400">🟣 Novos</span>
                  <span className="text-sm font-black font-mono text-white">{analytics.maturity.newCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400">🟡 Aprendendo</span>
                  <span className="text-sm font-black font-mono text-white">{analytics.maturity.learningCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400">🟢 Memorizados</span>
                  <span className="text-sm font-black font-mono text-white">{analytics.maturity.matureCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-400">🔴 Difíceis</span>
                  <span className="text-sm font-black font-mono text-white">{analytics.maturity.leechCount}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
