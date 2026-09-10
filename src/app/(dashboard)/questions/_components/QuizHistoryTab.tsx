import React, { useState } from "react";
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
  AlertTriangle,
  RotateCcw,
  Bookmark,
  BookOpen,
  Timer,
  Trash2,
} from "lucide-react";
import { QuestaoIA } from "../page";
import {
  TimedPacingModal,
  TimedPacingConfig,
} from "./TimedPacingModal";

export interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: QuestaoIA[];
  createdAt: string;
  topic?: { title: string } | null;
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
  const [viewMode, setViewMode] = useState<"all" | "errors">("all");
  const [pacingQuizTarget, setPacingQuizTarget] =
    useState<QuizHistoryItem | null>(null);

  // Filtra todas as questões erradas salvas no histórico
  const getErrorQuestions = (): (QuestaoIA & {
    banca: string;
    subject: string;
  })[] => {
    const errorQuestions: (QuestaoIA & { banca: string; subject: string })[] =
      [];
    history.forEach((item) => {
      const qArray = Array.isArray(item.questions) ? item.questions : [];
      qArray.forEach((q: any) => {
        if (q.userAnswer && !q.isCorrect) {
          errorQuestions.push({
            ...q,
            banca: item.banca || "Geral",
            subject: item.subject || "Conhecimentos Gerais",
          });
        }
      });
    });
    return errorQuestions;
  };

  const errorList = getErrorQuestions();

  const filteredHistory = history
    .filter((sim) => {
      const term = searchTerm.toLowerCase();
      const matchesBanca = sim.banca?.toLowerCase().includes(term);
      const matchesSubject = sim.subject?.toLowerCase().includes(term);
      const matchesDifficulty = sim.difficulty?.toLowerCase().includes(term);
      const topicMatch = sim.topic?.title?.toLowerCase().includes(term);
      return matchesBanca || matchesSubject || matchesDifficulty || topicMatch;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "subject") {
        return (a.subject || "").localeCompare(b.subject || "");
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleConfirmPacing = (config: TimedPacingConfig) => {
    if (!pacingQuizTarget) return;
    const params = new URLSearchParams({
      examId: pacingQuizTarget.id,
      pacing: config.pacingMode,
      pace: String(config.minutesPerQuestion),
      block: String(config.totalBlockMinutes),
      focus: config.strictAntiDistraction ? "true" : "false",
    });
    router.push(`/quiz/timed?${params.toString()}`);
    setPacingQuizTarget(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* SELETOR DE ABA & PESQUISA */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Histórico & Caderno de Erros
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
              Refaça simulados completos ou crie cadernos de recuperação focados
              nos seus pontos fracos.
            </p>
          </div>

          {/* TOGGLE: TODOS OS SIMULADOS X APENAS ERROS */}
          <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800/80 w-full sm:w-auto">
            <button
              onClick={() => setViewMode("all")}
              type="button"
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers size={13} />
              <span>Simulados ({history.length})</span>
            </button>
            <button
              onClick={() => setViewMode("errors")}
              type="button"
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === "errors"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle size={13} />
              <span>Erros ({errorList.length})</span>
            </button>
          </div>
        </div>

        {!isLoading && history.length > 0 && viewMode === "all" && (
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por banca, matéria, tópico ou dificuldade..."
                className="w-full bg-[#090d16]/80 border border-slate-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="relative w-full sm:w-auto shrink-0">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full sm:w-auto bg-[#090d16]/80 border border-slate-800/80 focus:border-indigo-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none cursor-pointer transition-all appearance-none pr-8 font-medium"
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="subject">Por Matéria (A-Z)</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* TELA DE CARREGAMENTO */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-xs">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
          <span>Buscando registros no banco de dados...</span>
        </div>
      ) : viewMode === "errors" ? (
        /* VISÃO: CADERNO DE ERROS DEDICADO */
        <div className="space-y-4">
          {errorList.length === 0 ? (
            <div className="bg-[#090d16]/60 border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Bookmark size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Nenhum erro registrado!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                À medida que você responder simulados e errar questões, elas
                serão salvas automaticamente neste caderno de treino.
              </p>
            </div>
          ) : (
            <div className="bg-[#090d16] border border-rose-500/30 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-rose-400 shrink-0"
                    />
                    <span>Simulado de Recuperação Intensiva</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Você possui {errorList.length} questão(ões) pendente(s) de
                    revisão.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    onClick={() =>
                      onLoadSavedQuiz(errorList, "Recuperação", "errors_session")
                    }
                    type="button"
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Modo Estudo</span>
                  </button>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams({
                        source: "errors",
                        pacing: "per_question",
                        pace: "3",
                        block: "30",
                      });
                      router.push(`/quiz/timed?${params.toString()}`);
                    }}
                    type="button"
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-950/50 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer"
                  >
                    <Timer size={14} />
                    <span>⚡ Cronometrado</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {errorList.map((errQ, idx) => (
                  <div
                    key={`err-${idx}`}
                    className="bg-slate-950/80 border border-slate-800/80 p-3 sm:p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mr-2 inline-block">
                        {errQ.banca}
                      </span>
                      <span className="text-slate-300 font-medium line-clamp-2 sm:line-clamp-1">
                        {errQ.enunciado.replace(/\*\*/g, "")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : history.length === 0 ? (
        /* SEM SIMULADOS */
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl my-6 space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <Layers size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              Nenhum simulado salvo ainda
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Gere novos cadernos de questões para treinar. Certifique-se de ter
              cadastrado suas matérias no{" "}
              <strong className="text-indigo-300">Edital</strong> para obter
              questões 100% personalizadas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
            <button
              onClick={onCreateNewQuiz}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer"
            >
              Gerar Simulado
            </button>
            <Link
              href="/edital"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700/80 flex items-center justify-center gap-2"
            >
              <BookOpen size={14} />
              <span>Ir para Editais</span>
            </Link>
          </div>
        </div>
      ) : filteredHistory.length === 0 ? (
        /* SEM RESULTADOS NA BUSCA */
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <p className="text-xs text-slate-400">
            Nenhum simulado encontrado para &quot;
            <span className="text-slate-200 font-medium">{searchTerm}</span>
            &quot;.
          </p>
        </div>
      ) : (
        /* LISTA DE SIMULADOS SALVOS DA VERSÃO COMPLETA */
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 items-start">
          {filteredHistory.map((item) => {
            const questionsArray = Array.isArray(item.questions)
              ? item.questions
              : [];
            const formattedDate = new Date(item.createdAt).toLocaleDateString(
              "pt-BR",
            );

            return (
              <div
                key={`quiz-history-${item.id}`}
                className="relative overflow-hidden bg-[#090d16]/90 border border-slate-800/80 hover:border-indigo-500/40 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.15)] transition-all duration-300 group"
              >
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-inner">
                        {item.banca}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar size={12} className="text-slate-600" />
                        {formattedDate}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirmDelete(item.id);
                      }}
                      type="button"
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Excluir simulado"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-indigo-300 transition-colors tracking-tight">
                      {item.subject}
                    </h3>

                    {item.topic?.title && (
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 max-w-full">
                          <FileText
                            size={11}
                            className="shrink-0 text-indigo-400"
                          />
                          <span className="truncate">{item.topic.title}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800/80 text-[11px] text-slate-300 font-medium">
                        <Layers
                          size={11}
                          className="text-indigo-400 shrink-0"
                        />
                        {item.difficulty}
                      </span>

                      <span className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800/80 text-[11px] text-slate-300 font-medium">
                        <HelpCircle
                          size={11}
                          className="text-indigo-400 shrink-0"
                        />
                        {questionsArray.length} questões
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-5 relative z-10 pt-3 border-t border-slate-800/60">
                  {confirmingDeleteId === item.id ? (
                    <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200">
                      <span className="text-[11px] text-rose-300 font-medium pl-1">
                        Excluir este simulado?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onDeleteSimulado(item.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-slate-100 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => onConfirmDelete(null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={() =>
                          onLoadSavedQuiz(questionsArray, item.banca, item.id)
                        }
                        disabled={loadingQuizId === item.id}
                        className="flex items-center justify-center gap-1.5 text-center py-2.5 px-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/35 hover:border-indigo-500/60 text-indigo-200 text-xs font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group/btn cursor-pointer min-h-10 w-full"
                        title="Modo Livre de Estudo"
                      >
                        {loadingQuizId === item.id ? (
                          <>
                            <Loader2
                              size={14}
                              className="animate-spin text-indigo-400 shrink-0"
                            />
                            <span className="truncate">Carregando...</span>
                          </>
                        ) : (
                          <>
                            <BookOpen size={14} className="text-indigo-400 shrink-0" />
                            <span className="truncate">
                              Refazer Caderno (Grátis)
                            </span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setPacingQuizTarget(item)}
                        type="button"
                        className="flex items-center justify-center gap-1.5 text-center py-2.5 px-2 bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/40 hover:border-violet-500/70 text-violet-200 text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-violet-950/40 cursor-pointer min-h-10 group/timed w-full"
                        title="Iniciar Simulado Cronometrado Sob Pressão de Tempo"
                      >
                        <Timer
                          size={14}
                          className="text-violet-400 group-hover/timed:scale-110 transition-transform shrink-0"
                        />
                        <span className="truncate">
                          ⚡ Simulado Cronometrado
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE RITMO PARA O SIMULADO SELECIONADO */}
      {pacingQuizTarget && (
        <TimedPacingModal
          isOpen={Boolean(pacingQuizTarget)}
          onClose={() => setPacingQuizTarget(null)}
          title={pacingQuizTarget.subject}
          subtitle={`Banca ${pacingQuizTarget.banca} • ${pacingQuizTarget.topic?.title || "Tópicos Gerais"}`}
          totalQuestions={
            Array.isArray(pacingQuizTarget.questions)
              ? pacingQuizTarget.questions.length
              : 10
          }
          onConfirm={handleConfirmPacing}
        />
      )}
    </div>
  );
}
