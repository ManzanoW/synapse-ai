"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  Lightbulb,
  Bug,
  Heart,
  HelpCircle,
  Star,
  Send,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { submitUserFeedbackAction } from "@/actions/feedback-actions";
import { useGamification } from "@/context/GamificationContext";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = "SUGGESTION" | "BUG" | "PRAISE" | "OTHER";

const FEEDBACK_TYPES: {
  id: FeedbackType;
  label: string;
  desc: string;
  icon: React.ElementType;
  activeColor: string;
  activeBorder: string;
}[] = [
  {
    id: "SUGGESTION",
    label: "Sugestão",
    desc: "Ideia ou melhoria para a plataforma",
    icon: Lightbulb,
    activeColor: "bg-amber-500/20 text-amber-300",
    activeBorder: "border-amber-500/40",
  },
  {
    id: "BUG",
    label: "Problema / Bug",
    desc: "Algo que não funcionou como esperado",
    icon: Bug,
    activeColor: "bg-rose-500/20 text-rose-300",
    activeBorder: "border-rose-500/40",
  },
  {
    id: "PRAISE",
    label: "Elogio",
    desc: "O que você mais gostou de usar",
    icon: Heart,
    activeColor: "bg-emerald-500/20 text-emerald-300",
    activeBorder: "border-emerald-500/40",
  },
  {
    id: "OTHER",
    label: "Outro",
    desc: "Dúvidas gerais ou comentários",
    icon: HelpCircle,
    activeColor: "bg-violet-500/20 text-violet-300",
    activeBorder: "border-violet-500/40",
  },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { refreshStats } = useGamification();

  const [type, setType] = useState<FeedbackType>("SUGGESTION");
  const [category, setCategory] = useState("GERAL");
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage("Por favor, escreva uma mensagem com pelo menos 5 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitUserFeedbackAction({
        type,
        category,
        message,
        rating,
        pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
      });

      if (res.success) {
        setIsSubmitted(true);
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch {}

        if (refreshStats) {
          refreshStats();
        }

        setTimeout(() => {
          setIsSubmitted(false);
          setMessage("");
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.error || "Falha ao enviar feedback.");
      }
    } catch {
      setErrorMessage("Erro ao conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Card do Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-linear-to-b from-[#0e1322] via-[#090d18] to-[#04060c] border border-white/15 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 z-10 space-y-5"
        >
          {/* Botão de Fechar */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>

          {isSubmitted ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-white">Muito obrigado pelo seu feedback!</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Suas observações ajudam diretamente a moldar a plataforma ideal para os concurseiros.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold font-mono">
                  <Sparkles size={12} className="text-amber-300" />
                  +15 XP Concedidos
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cabeçalho */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                  <MessageSquarePlus size={11} /> Canal Direto com os Criadores
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Como está sendo sua experiência?
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conta pra gente o que achou, o que podemos melhorar ou qualquer detalhe que sentiu falta.
                </p>
              </div>

              {/* 1. Seleção de Tipo de Feedback */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FEEDBACK_TYPES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? `${item.activeColor} ${item.activeBorder} shadow-sm`
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-[11px] font-bold leading-none">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2. Avaliação em Estrelas */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-300 font-medium">Nota para a plataforma:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        size={17}
                        className={
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Área de Texto */}
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === "BUG"
                      ? "O que aconteceu? Em qual página ou ação você percebeu o erro?"
                      : type === "SUGGESTION"
                      ? "Qual funcionalidade ou melhoria tornaria seus estudos ainda melhores?"
                      : type === "PRAISE"
                      ? "O que mais te surpreendeu positivamente no Synapse AI?"
                      : "Escreva sua mensagem aqui..."
                  }
                  className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 resize-none outline-none transition-all leading-relaxed"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-400 font-semibold">{errorMessage}</p>
              )}

              {/* 4. Rodapé e Envio */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Sparkles size={11} className="text-violet-400" />
                  +15 XP de estudo ao enviar
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-violet-950/50 border border-violet-400/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Enviar Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
