import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  Loader2,
  X,
  RotateCcw,
  BookOpen,
  Timer,
  Trash2,
  Sparkles,
  BarChart3,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { QuestaoIA } from "../page";

export interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: QuestaoIA[];
  createdAt: string;
  topic?: { title: string } | null;
  timeSpentSeconds?: number;
}

interface QuizHistoryTabProps {
  history: QuizHistoryItem[];
  isLoading: boolean;
  searchTerm: string;
  sortBy: string;
  confirmingDeleteId: string | null;
  loadingQuizId: string | null;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onLoadSavedQuiz: (questions: QuestaoIA[], banca: string, id: string) => void;
  onConfirmDelete: (id: string | null) => void;
  onDeleteSimulado: (id: string) => void;
  onCreateNewQuiz: () => void;
}

interface QuizPerformance {
  isCompleted: boolean;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  timeSpentSeconds: number;
}

function getQuizPerformance(item: QuizHistoryItem): QuizPerformance {
  const questionsArray = Array.isArray(item.questions) ? item.questions : [];
  const total = questionsArray.length;
  if (total === 0) {
    return {
      isCompleted: false,
      totalQuestions: 0,
      correctCount: 0,
      percentage: 0,
      timeSpentSeconds: 0,
    };
  }

  // Identifica se o simulado foi respondido/concluído
  const isCompleted = questionsArray.some(
    (q: any) =>
      typeof q.isCorrect === "boolean" ||
      (q.userAnswer !== undefined && q.userAnswer !== null && q.userAnswer !== "")
  );

  const correctCount = questionsArray.filter((q: any) => {
    if (typeof q.isCorrect === "boolean") return q.isCorrect;
    if (q.userAnswer && q.gabaritoCorreto) {
      return (
        String(q.userAnswer).trim().toLowerCase() ===
        String(q.gabaritoCorreto).trim().toLowerCase()
      );
    }
    return false;
  }).length;

  const percentage =
    isCompleted && total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Telemetria do tempo gasto
  let totalTime = (item as any).timeSpentSeconds || (item as any).timerSeconds || 0;
  if (!totalTime) {
    const sumFromQuestions = questionsArray.reduce(
      (acc: number, q: any) => acc + (Number(q.timeSpentSeconds) || 0),
      0
    );
    if (sumFromQuestions > 0) {
      totalTime = sumFromQuestions;
    }
  }

  return {
    isCompleted,
    totalQuestions: total,
    correctCount,
    percentage,
    timeSpentSeconds: totalTime,
  };
}

function formatTelemetryTime(
  timeSpentSeconds: number,
  isCompleted: boolean,
  totalQuestions: number
): string {
  if (timeSpentSeconds > 0) {
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    if (mins === 0) return `${secs}s gastos`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ""} gastos`;
  }
  if (!isCompleted) {
    return `~${Math.max(1, totalQuestions) * 3} min est.`;
  }
  return `~${Math.max(1, totalQuestions) * 2} min gastos`;
}

export function QuizHistoryTab({
  history,
  isLoading,
  searchTerm,
  sortBy,
  confirmingDeleteId,
  loadingQuizId,
  onSearchChange,
  onSortChange,
  onLoadSavedQuiz,
  onConfirmDelete,
  onDeleteSimulado,
  onCreateNewQuiz,
}: QuizHistoryTabProps) {
  const router = useRouter();

  // Filtragem e Ordenação dos Cadernos
  const filteredHistory = history
    .filter((sim) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      const matchesBanca = sim.banca?.toLowerCase().includes(term);
      const matchesSubject = sim.subject?.toLowerCase().includes(term);
      const matchesDifficulty = sim.difficulty?.toLowerCase().includes(term);
      const topicMatch = sim.topic?.title?.toLowerCase().includes(term);
      return matchesBanca || matchesSubject || matchesDifficulty || topicMatch;
    })
    .sort((a, b) => {
      if (sortBy === "highest_score") {
        const perfA = getQuizPerformance(a);
        const perfB = getQuizPerformance(b);
        if (perfB.isCompleted !== perfA.isCompleted) {
          return perfB.isCompleted ? 1 : -1;
        }
        if (perfB.percentage !== perfA.percentage) {
          return perfB.percentage - perfA.percentage;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "lowest_score") {
        const perfA = getQuizPerformance(a);
        const perfB = getQuizPerformance(b);
        if (perfA.isCompleted && perfB.isCompleted) {
          if (perfA.percentage !== perfB.percentage) {
            return perfA.percentage - perfB.percentage;
          }
        } else if (perfA.isCompleted !== perfB.isCompleted) {
          return perfA.isCompleted ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Padrão: "newest"
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 1. CABEÇALHO DA ABA (LIMPO E SEM REDUNDÂNCIAS) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Histórico de Cadernos & Simulados
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                {history.length}{" "}
                {history.length === 1
                  ? "caderno disponível"
                  : "cadernos disponíveis"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Consulte seu relatório analítico de acertos, revise o gabarito
              completo ou refaça cadernos salvos.
            </p>
          </div>
        </div>

        {/* BARRA DE BUSCA E FILTROS COM GLASSMORPHISM */}
        {!isLoading && history.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por matéria, foco ou banca..."
                className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  title="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-auto shrink-0">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full sm:w-auto bg-[#090d16] sm:bg-white/[0.03] backdrop-blur-md border border-white/10 focus:border-violet-500/50 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-zinc-200 outline-none cursor-pointer transition-all appearance-none font-medium"
              >
                <option value="newest" className="bg-[#0b0f19] text-zinc-200">
                  Mais recentes
                </option>
                <option
                  value="highest_score"
                  className="bg-[#0b0f19] text-zinc-200"
                >
                  Maior pontuação
                </option>
                <option
                  value="lowest_score"
                  className="bg-[#0b0f19] text-zinc-200"
                >
                  Menor pontuação
                </option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. CONTEÚDO PRINCIPAL: SKELETON / EMPTY STATES / GRID DE CARDS */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3 text-xs">
          <Loader2 size={24} className="animate-spin text-violet-400" />
          <span>Buscando registros no banco de dados...</span>
        </div>
      ) : history.length === 0 ? (
        /* ESTADO VAZIO: NENHUM SIMULADO CADASTRADO */
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center bg-white/[0.01] backdrop-blur-md border border-white/10 rounded-3xl my-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/10">
            <Layers size={26} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white tracking-tight">
              Nenhum simulado salvo ainda
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Gere simulados personalizados com base nas disciplinas do seu
              Edital para exercitar questões e acompanhar seu progresso.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
            <button
              onClick={onCreateNewQuiz}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-violet-600/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>Gerar Primeiro Simulado</span>
            </button>
            <Link
              href="/edital"
              className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <BookOpen size={14} />
              <span>Ir para Edital</span>
            </Link>
          </div>
        </div>
      ) : filteredHistory.length === 0 ? (
        /* ESTADO VAZIO: BUSCA SEM RESULTADOS */
        <div className="text-center py-12 bg-white/[0.01] backdrop-blur-md border border-white/10 rounded-2xl space-y-2">
          <p className="text-xs text-zinc-400">
            Nenhum simulado encontrado para &quot;
            <span className="text-zinc-100 font-medium">{searchTerm}</span>
            &quot;.
          </p>
          <button
            onClick={() => onSearchChange("")}
            type="button"
            className="text-xs text-violet-400 hover:text-violet-300 font-medium underline underline-offset-2 cursor-pointer transition-colors"
          >
            Limpar filtro de busca
          </button>
        </div>
      ) : (
        /* GRID DE CARDS REDESENHADOS (grid md:grid-cols-2 gap-5) */
        <div className="grid md:grid-cols-2 gap-5 items-stretch">
          {filteredHistory.map((item) => {
            const questionsArray = Array.isArray(item.questions)
              ? item.questions
              : [];
            const performance = getQuizPerformance(item);
            const formattedDate = new Date(item.createdAt).toLocaleDateString(
              "pt-BR"
            );

            // Cores dinâmicas da badge de desempenho
            let badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
            if (performance.percentage >= 70) {
              badgeStyle =
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            } else if (performance.percentage >= 50) {
              badgeStyle =
                "bg-violet-500/10 text-violet-400 border-violet-500/20";
            }

            return (
              <div
                key={`quiz-card-${item.id}`}
                className="relative overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-violet-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.15)] group"
              >
                {/* Glow sutil de fundo */}
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all pointer-events-none" />

                {/* TOPO DO CARD */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Badges compactas: Banca e Data */}
                    <div className="flex items-center gap-2">
                      <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-inner">
                        {item.banca || "GERAL"}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
                        <Calendar size={12} className="text-zinc-500" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Lado direito: Badge de Desempenho e Botão Discreto de Exclusão */}
                    <div className="flex items-center gap-2">
                      {performance.isCompleted ? (
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide shadow-sm ${badgeStyle}`}
                        >
                          <span className="font-bold">
                            {performance.percentage}%
                          </span>
                          <span className="opacity-80 text-[10px]">
                            ({performance.correctCount}/
                            {performance.totalQuestions} acertos)
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[11px] font-medium">
                          <Clock size={11} className="shrink-0" />
                          <span>Não finalizado</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmDelete(item.id);
                        }}
                        type="button"
                        className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Excluir simulado"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Confirmação de Exclusão Inline */}
                  {confirmingDeleteId === item.id && (
                    <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200">
                      <span className="text-[11px] text-rose-300 font-medium pl-1 flex items-center gap-1.5">
                        <AlertTriangle
                          size={13}
                          className="text-rose-400 shrink-0"
                        />
                        Excluir este simulado?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onDeleteSimulado(item.id)}
                          type="button"
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => onConfirmDelete(null)}
                          type="button"
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MIOLO DO CARD */}
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <h3 className="text-white font-medium text-base line-clamp-2 group-hover:text-violet-300 transition-colors tracking-tight">
                        {item.subject}
                      </h3>
                      {item.topic?.title && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 line-clamp-1">
                          <FileText
                            size={12}
                            className="text-violet-400 shrink-0"
                          />
                          <span className="truncate">{item.topic.title}</span>
                        </div>
                      )}
                    </div>

                    {/* Linha de telemetria: pílulas discretas com Dificuldade, Qtd e Tempo gasto */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-[11px] text-zinc-300 font-medium">
                        <Layers size={11} className="text-violet-400 shrink-0" />
                        <span>{item.difficulty || "Média"}</span>
                      </span>

                      <span className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-[11px] text-zinc-300 font-medium">
                        <HelpCircle
                          size={11}
                          className="text-violet-400 shrink-0"
                        />
                        <span>
                          {questionsArray.length}{" "}
                          {questionsArray.length === 1
                            ? "questão"
                            : "questões"}
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-[11px] text-zinc-300 font-medium">
                        <Timer size={11} className="text-violet-400 shrink-0" />
                        <span>
                          {formatTelemetryTime(
                            performance.timeSpentSeconds,
                            performance.isCompleted,
                            questionsArray.length
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DO CARD (2 BOTÕES SEM TRUNCAMENTO) */}
                <div className="mt-5 pt-3.5 border-t border-white/5 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {/* Botão Secundário: Gabarito & Métricas */}
                    <button
                      onClick={() =>
                        router.push(`/questions/${item.id}/results`)
                      }
                      type="button"
                      className="flex items-center justify-center gap-2 py-2.5 px-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-violet-500/30 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer w-full text-center"
                      title="Abrir relatório de desempenho e respostas comentadas"
                    >
                      <BarChart3 size={14} className="text-violet-400 shrink-0" />
                      <span className="whitespace-nowrap">
                        Gabarito & Métricas
                      </span>
                    </button>

                    {/* Botão Primário: Refazer Prova */}
                    <button
                      onClick={() =>
                        onLoadSavedQuiz(questionsArray, item.banca, item.id)
                      }
                      disabled={loadingQuizId === item.id}
                      type="button"
                      className="flex items-center justify-center gap-2 py-2.5 px-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/35 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full text-center"
                      title="Reiniciar este caderno de questões do início"
                    >
                      {loadingQuizId === item.id ? (
                        <>
                          <Loader2
                            size={14}
                            className="animate-spin text-white shrink-0"
                          />
                          <span className="whitespace-nowrap">
                            Carregando...
                          </span>
                        </>
                      ) : (
                        <>
                          <RotateCcw
                            size={14}
                            className="shrink-0 group-hover:rotate-[-45deg] transition-transform"
                          />
                          <span className="whitespace-nowrap">
                            Refazer Prova
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
