"use client";

import React from "react";
import {
  Send,
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  banca: string;
  themeTitle: string;
  lineCount: number;
  wordCount: number;
  formattedTime: string;
  isEvaluating: boolean;
}

export function SubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  banca,
  themeTitle,
  lineCount,
  wordCount,
  formattedTime,
  isEvaluating,
}: SubmitConfirmationModalProps) {
  if (!isOpen) return null;

  const isTooShortWords = wordCount < 30;
  const isBelowMinLines = lineCount < 20;
  const isAboveMaxLines = lineCount > 30;
  const isInConformity = !isTooShortWords && !isBelowMinLines && !isAboveMaxLines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-violet-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* CABEÇALHO */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Entrega da Prova Discursiva
              </h3>
              <p className="text-xs text-slate-400">
                Confirmar envio para a banca examinadora
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isEvaluating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          {/* IDENTIFICAÇÃO DA PROVA */}
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-violet-400 uppercase">
              <span>Banca {banca}</span>
              <span className="text-slate-400 font-normal">Folha Definitiva</span>
            </div>
            <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">
              {themeTitle}
            </p>
          </div>

          {/* MÉTRICAS DA SUBMISSÃO */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
              <Clock size={15} className="text-violet-400 mb-1" />
              <div className="text-xs font-mono font-bold text-white">
                {formattedTime}
              </div>
              <div className="text-[10px] text-slate-400">Tempo de Prova</div>
            </div>

            <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
              <FileText
                size={15}
                className={
                  isBelowMinLines
                    ? "text-amber-400"
                    : isAboveMaxLines
                    ? "text-rose-400"
                    : "text-emerald-400"
                }
              />
              <div
                className={`text-xs font-mono font-bold ${
                  isBelowMinLines
                    ? "text-amber-300"
                    : isAboveMaxLines
                    ? "text-rose-300"
                    : "text-emerald-300"
                }`}
              >
                {lineCount} / 30
              </div>
              <div className="text-[10px] text-slate-400">Linhas</div>
            </div>

            <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
              <Sparkles size={15} className="text-indigo-400 mb-1" />
              <div className="text-xs font-mono font-bold text-white">
                {wordCount}
              </div>
              <div className="text-[10px] text-slate-400">Palavras</div>
            </div>
          </div>

          {/* ESTADO 1: TEXTO INSUFICIENTE (< 30 PALAVRAS) */}
          {isTooShortWords && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
              <XCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-rose-300">
                  Texto Muito Curto para Avaliação
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sua redação possui apenas {wordCount} palavras. São necessárias pelo menos 30 palavras para que o examinador possa avaliar estrutura, gramática e coerência.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 2: ABAIXO DO LIMITE MÍNIMO DE LINHAS (< 20 LINHAS) */}
          {!isTooShortWords && isBelowMinLines && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-amber-300">
                  Abaixo do Mínimo Oficial de Linhas
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu texto possui <strong>{lineCount} linhas</strong>. Bancas oficiais como o <strong>{banca}</strong> exigem entre <strong>20 e 30 linhas</strong>. Redações com menos de 20 linhas costumam sofrer descontos severos ou nota zero no critério de estrutura.
                </p>
                <p className="text-[11px] text-amber-200/80 mt-1">
                  Deseja enviar mesmo assim para receber a nota real e o feedback da banca?
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 3: ACIMA DO LIMITE MÁXIMO (> 30 LINHAS) */}
          {!isTooShortWords && isAboveMaxLines && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-rose-300">
                  Limite Máximo de 30 Linhas Ultrapassado
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu texto tem <strong>{lineCount} linhas</strong>. Qualquer trecho escrito além da linha 30 será totalmente desconsiderado pelo examinador.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 4: CONFORMIDADE PERFEITA (20 a 30 LINHAS) */}
          {isInConformity && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-emerald-300">
                  Conformidade com os Padrões da Banca
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Excelente! Sua redação atinge a extensão oficial exigida ({lineCount} linhas). O examinador de IA avaliará rigorosamente sua gramática, repertório e coesão.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="p-5 border-t border-white/10 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isEvaluating}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isTooShortWords ? "Voltar e Escrever Mais" : "Voltar à Folha"}
          </button>

          {!isTooShortWords && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isEvaluating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all cursor-pointer ${
                isBelowMinLines
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-950/60"
                  : "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-950/60"
              }`}
            >
              {isEvaluating ? (
                <>
                  <Sparkles size={14} className="animate-spin" />
                  <span>Enviando para o Examinador...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>
                    {isBelowMinLines
                      ? "Entregar Mesmo Abaixo do Mínimo"
                      : "Confirmar e Enviar para a Banca"}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
