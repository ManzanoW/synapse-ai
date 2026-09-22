"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Lightbulb,
  Scale,
  Zap,
  AlertTriangle,
  X,
  Copy,
  Check,
  Loader2,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { MentorGuidance } from "@/types/quiz";
import { getQuestionMentorGuidanceAction } from "@/actions/quiz-actions";

export interface MentorCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  questionIndex?: number;
  questionText: string;
  options?: Array<{ id: string; texto: string }>;
  correctAnswer?: string;
  explanation?: string;
  banca?: string;
  subject?: string;
  mentorGuidance?: MentorGuidance | null;
  onGuidanceGenerated?: (guidance: MentorGuidance) => void;
}

type TabType = "socratic" | "simplified" | "mnemonic";

export function MentorCopilotDrawer({
  isOpen,
  onClose,
  questionIndex,
  questionText,
  options = [],
  correctAnswer = "",
  explanation = "",
  banca = "Geral",
  subject = "Conhecimentos Gerais",
  mentorGuidance: initialGuidance,
  onGuidanceGenerated,
}: MentorCopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("socratic");
  const [guidance, setGuidance] = useState<MentorGuidance | null>(
    initialGuidance || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState<string | null>(null);

  // Sincroniza orientacao quando a questao muda
  useEffect(() => {
    setGuidance(initialGuidance || null);
  }, [initialGuidance, questionText]);

  // Tecla de atalho: Esc para fechar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Busca orientacao sob demanda se a questao for legada
  const handleFetchGuidance = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await getQuestionMentorGuidanceAction({
        enunciado: questionText,
        alternativas: options,
        gabaritoCorreto: correctAnswer,
        justificativa: explanation,
        banca,
        subject,
      });

      if (res.success && res.data) {
        setGuidance(res.data);
        if (onGuidanceGenerated) {
          onGuidanceGenerated(res.data);
        }
      } else {
        alert(res.error || "Não foi possível gerar a orientação do Mentor IA.");
      }
    } catch (err) {
      console.error("Erro ao solicitar mentor guidance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(key);
    setTimeout(() => setHasCopied(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-quiz-sidebar="true"
          data-mentor-drawer="true"
          className="fixed inset-0 z-[100] flex justify-end"
        >
          {/* Backdrop com blur escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer deslizante da direita */}
          <motion.div
            data-quiz-sidebar="true"
            data-mentor-drawer="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg bg-[#080c16] border-l border-violet-500/20 shadow-2xl shadow-violet-950/40 flex flex-col h-full z-10 overflow-hidden"
          >
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-600/15 blur-[100px]" />

        {/* HEADER DO COPILOT */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0c1020]/90 backdrop-blur-md relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/30">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    Copilot Mentor IA
                    <span className="text-[10px] bg-violet-500/20 border border-violet-400/40 text-violet-300 font-mono px-2 py-0.5 rounded-full font-bold">
                      Tutor Socrático
                    </span>
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Orientação cognitiva para desbloquear seu raciocínio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold text-slate-400 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                ⌘J / Esc
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* BANNER DE CONTEXTO DA QUESTÃO */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                {typeof questionIndex === "number" ? `Questão ${questionIndex + 1}` : "Questão Atual"} • {banca}
              </span>
              <p className="text-slate-300 text-[11px] font-medium truncate mt-0.5">
                {subject}
              </p>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono shrink-0">
              {initialGuidance ? "0ms Instantâneo" : "IA Sob Demanda"}
            </span>
          </div>

          {/* TABS SELECTOR */}
          <div className="grid grid-cols-3 gap-1.5 mt-3.5 p-1 bg-black/40 border border-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("socratic")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "socratic"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Lightbulb size={13} />
              <span className="truncate">Socrático</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("simplified")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "simplified"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Scale size={13} />
              <span className="truncate">Lei Seca</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mnemonic")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "mnemonic"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Zap size={13} />
              <span className="truncate">Mnemônico</span>
            </button>
          </div>
        </div>

        {/* CORPO DO DRAWER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 relative z-10">
          {!guidance ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Sparkles size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">
                  Orientação IA Sob Demanda
                </h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Esta questão é legada e ainda não possui os parâmetros do Mentor IA pré-calculados. Deseja consultá-lo agora?
                </p>
              </div>

              <button
                type="button"
                onClick={handleFetchGuidance}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Consultando Mentor...</span>
                  </>
                ) : (
                  <>
                    <Brain size={14} />
                    <span>Desbloquear Orientação com IA</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "socratic" && (
                <motion.div
                  key="tab-socratic"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-linear-to-b from-violet-950/30 to-violet-950/10 border border-violet-500/30 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-violet-300 text-xs font-bold">
                        <Lightbulb size={16} className="text-violet-400" />
                        <span>Dica Socrática (Sem Spoilers)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            guidance.socraticHint,
                            "socraticHint",
                          )
                        }
                        className="text-slate-400 hover:text-white p-1 rounded-md text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar dica"
                      >
                        {hasCopied === "socraticHint" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line font-medium">
                      {guidance.socraticHint}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-violet-500/20 text-[11px] text-violet-300/80 flex items-center gap-1.5">
                      <HelpCircle size={12} className="shrink-0" />
                      <span>
                        Tente eliminar ao menos 2 alternativas aplicando esse princípio antes de responder.
                      </span>
                    </div>
                  </div>

                  {/* Resumo pedagógico do comando */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Instrução do Tutor:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Repare se o comando da questão pede a alternativa <strong>CORRETA</strong> ou a <strong>INCORRETA</strong>, e desconfie de expressões restritivas como <em>&ldquo;sempre&rdquo;</em>, <em>&ldquo;nunca&rdquo;</em> ou <em>&ldquo;exclusivamente&rdquo;</em>.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "simplified" && (
                <motion.div
                  key="tab-simplified"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-linear-to-b from-indigo-950/30 to-indigo-950/10 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                        <Scale size={16} className="text-indigo-400" />
                        <span>Tradutor de Lei Seca & Juridiquês</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            guidance.simplifiedLaw,
                            "simplifiedLaw",
                          )
                        }
                        className="text-slate-400 hover:text-white p-1 rounded-md text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar explicação"
                      >
                        {hasCopied === "simplifiedLaw" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line font-medium">
                      {guidance.simplifiedLaw}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2.5">
                    <BookOpen size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-snug">
                      Ao transformar a norma abstrata em um exemplo prático do dia a dia, sua retenção sobe para mais de 80% no longo prazo.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "mnemonic" && (
                <motion.div
                  key="tab-mnemonic"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {/* Bloco Mnemônico */}
                  <div className="p-4 rounded-2xl bg-linear-to-b from-amber-950/30 to-amber-950/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                        <Zap size={16} className="text-amber-400" />
                        <span>Fábrica de Mnemônicos & Gatilhos</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(guidance.mnemonic, "mnemonic")
                        }
                        className="text-slate-400 hover:text-white p-1 rounded-md text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar mnemônico"
                      >
                        {hasCopied === "mnemonic" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-semibold tracking-wide leading-relaxed">
                      💡 {guidance.mnemonic}
                    </div>
                  </div>

                  {/* Bloco Pegadinha da Banca */}
                  <div className="p-4 rounded-2xl bg-linear-to-b from-rose-950/30 to-rose-950/10 border border-rose-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                        <AlertTriangle size={16} className="text-rose-400" />
                        <span>Pegadinha Clássica da Banca ({banca})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(guidance.trapWarning, "trapWarning")
                        }
                        className="text-slate-400 hover:text-white p-1 rounded-md text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar alerta"
                      >
                        {hasCopied === "trapWarning" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                      {guidance.trapWarning}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* FOOTER DO DRAWER */}
        <div className="p-4 border-t border-white/10 bg-[#0c1020]/90 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 relative z-10">
          <span className="font-mono text-[11px]">
            Synapse Copilot • 0 requisições extras
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold cursor-pointer transition-all active:scale-95"
          >
            Continuar Questão
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
}
