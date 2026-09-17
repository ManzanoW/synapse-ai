"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
  ChevronRight,
  Sparkles,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  getUserEssaysHistoryAction,
  getEssaySubmissionByIdAction,
  deleteEssayAction,
  EssayEvaluationResult,
} from "@/actions/essay-actions";

interface EssayHistoryListProps {
  onSelectEssay: (essay: EssayEvaluationResult) => void;
  onNewEssay: () => void;
}

export function EssayHistoryList({
  onSelectEssay,
  onNewEssay,
}: EssayHistoryListProps) {
  const [history, setHistory] = useState<
    Array<{
      id: string;
      themeTitle: string;
      banca: string;
      subjectArea?: string | null;
      score: number | null;
      maxScore: number;
      isApproved: boolean | null;
      lineCount: number;
      wordCount: number;
      createdAt: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [essayToDeleteId, setEssayToDeleteId] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await getUserEssaysHistoryAction();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpenEssay = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await getEssaySubmissionByIdAction(id);
      if (res.success && res.data) {
        onSelectEssay(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!essayToDeleteId) return;
    const targetId = essayToDeleteId;
    setEssayToDeleteId(null);

    try {
      const res = await deleteEssayAction(targetId);
      if (res.success) {
        setHistory((prev) => prev.filter((item) => item.id !== targetId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Histórico de Redações</h2>
          <p className="text-xs text-slate-400">
            Acompanhe a evolução das suas notas e o feedback das bancas
          </p>
        </div>

        <button
          type="button"
          onClick={onNewEssay}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Escrever Redação</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Sparkles className="animate-spin text-violet-400" size={20} />
          <span>Carregando histórico...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <FileText size={28} />
          </div>
          <h3 className="text-sm font-bold text-white">
            Nenhuma redação realizada ainda
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Pratique discursivas com temas inéditos de concursos e receba correções honestas da banca com apontamento linha a linha.
          </p>
          <button
            type="button"
            onClick={onNewEssay}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg cursor-pointer"
          >
            <Plus size={14} />
            <span>Fazer Minha 1ª Redação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {history.map((item) => {
            const isApproved = item.isApproved;
            const dateStr = new Date(item.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                onClick={() => handleOpenEssay(item.id)}
                className="bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 hover:border-violet-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer shadow-md group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[10px] font-mono font-bold">
                      {item.banca}
                    </span>
                    {item.subjectArea && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.subjectArea}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      • {dateStr}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                    {item.themeTitle}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span>{item.wordCount} palavras</span>
                    <span>•</span>
                    <span>{item.lineCount} linhas</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {item.score !== null && (
                    <div className="flex flex-col items-end">
                      <div className="text-lg font-black text-white">
                        {item.score.toFixed(1)}
                        <span className="text-xs text-slate-400 font-normal">
                          /{item.maxScore}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isApproved ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 size={11} />
                            <span>Aprovado</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} />
                            <span>Abaixo do Corte</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEssayToDeleteId(item.id);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="p-1.5 rounded-xl bg-white/5 group-hover:bg-violet-600 text-slate-400 group-hover:text-white transition-all">
                    {loadingId === item.id ? (
                      <Sparkles size={16} className="animate-spin" />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {essayToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-2xl p-5 flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-white">
              Excluir Redação do Histórico?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Esta ação removerá permanentemente esta redação, notas e o feedback da banca examinadora.
            </p>
            <div className="flex items-center justify-end gap-2 w-full mt-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEssayToDeleteId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-all cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
