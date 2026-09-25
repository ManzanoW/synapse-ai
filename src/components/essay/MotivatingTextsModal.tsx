"use client";

import React from "react";
import { X, BookOpen, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { EssayTheme } from "@/actions/essay-actions";

interface MotivatingTextsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: EssayTheme;
}

export function MotivatingTextsModal({
  isOpen,
  onClose,
  theme,
}: MotivatingTextsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-violet-500/30 rounded-2xl w-full max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="text-violet-600 dark:text-violet-400" size={18} />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Caderno de Questões • Proposta Discursiva
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-white/5">
            <div className="text-[10px] font-mono text-violet-600 dark:text-violet-300 font-bold uppercase tracking-widest mb-1">
              {theme.banca} • {theme.subjectArea}
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
              {theme.title}
            </h4>
          </div>

          {/* Textos Motivadores */}
          {theme.motivatingTexts && theme.motivatingTexts.length > 0 && (
            <div className="flex flex-col gap-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Textos Motivadores
              </h5>
              {theme.motivatingTexts.map((txt, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 break-words">
                      {txt.title}
                    </span>
                    {txt.source && (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                        {txt.source}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                    {txt.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tópicos Avaliados */}
          {theme.expectedTopics && theme.expectedTopics.length > 0 && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Aspectos Obrigatórios Avaliados pela Banca
              </span>
              <ul className="space-y-1.5">
                {theme.expectedTopics.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instruções Oficiais */}
          {theme.instructions && theme.instructions.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-300 block mb-1">
                Instruções Gerais de Prova:
              </span>
              <ul className="list-disc list-inside space-y-0.5">
                {theme.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
