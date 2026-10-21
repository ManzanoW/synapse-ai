// src/components/share/PublicDeckViewer.tsx
"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Brain,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Copy,
  Check,
  Share2,
  Bookmark,
  ShieldCheck,
  User,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Crown,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { PublicDeckData, clonePublicDeckAction } from "@/actions/share-actions";

interface PublicDeckViewerProps {
  deck: PublicDeckData;
  isLoggedIn: boolean;
}

export function PublicDeckViewer({ deck, isLoggedIn }: PublicDeckViewerProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCloning, startCloning] = useTransition();
  const [clonedSuccessId, setClonedSuccessId] = useState<string | null>(null);

  const currentCard = deck.flashcards[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / deck.totalCards) * 100);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % deck.totalCards);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev - 1 + deck.totalCards) % deck.totalCards);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(
        `🔥 *Material de Estudo Gratuito • Synapse AI*\n\n` +
          `📚 *Baralho*: ${deck.title}\n` +
          `🎯 *Disciplina*: ${deck.subjectName || "Concursos Públicos"}\n` +
          `⚡ *Total*: ${deck.totalCards} Cartões com repetição espaçada inteligente e Estudo em Áudio!\n\n` +
          `Acesse e estude direto pelo link:\n${window.location.href}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  const handleCloneDeck = () => {
    if (!isLoggedIn) {
      // Redireciona para cadastro mantendo o retorno para o baralho compartilhado
      router.push(`/login?callbackUrl=/share/deck/${deck.id}`);
      return;
    }

    startCloning(async () => {
      const res = await clonePublicDeckAction(deck.id);
      if (res.success && res.newDeckId) {
        setClonedSuccessId(res.newDeckId);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. NAVBAR PÚBLICA MODERNA */}
      <header className="border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Brain size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                Synapse <span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-1">
                REPETIÇÃO INTELIGENTE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
              >
                Ir para o Meu Painel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href={`/login?callbackUrl=/share/deck/${deck.id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50"
                >
                  Criar Conta Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-8">
        {/* CABEÇALHO DO BARALHO COMPARTILHADO */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} /> Baralho Compartilhado
            </span>
            {deck.subjectName && (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                {deck.subjectName}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-slate-800/60 text-slate-400 text-xs font-mono">
              {deck.totalCards} Flashcards
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {deck.title}
          </h1>

          {/* AUTOR DO BARALHO */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-1 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-bold text-sm overflow-hidden">
                {deck.author.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={deck.author.image}
                    alt={deck.author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">
                    {deck.author.name}
                  </span>
                  {deck.author.isPro && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                      <Crown size={10} /> Pro
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Compartilhado via Synapse AI
                </span>
              </div>
            </div>

            {/* BOTÕES DE COMPARTILHAMENTO RÁPIDO */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-colors cursor-pointer"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. VISUALIZADOR INTERATIVO COM FLIP CARD */}
        {deck.flashcards.length > 0 && currentCard ? (
          <div className="space-y-4">
            {/* Barra de Progresso */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
              <span>
                Card {currentIdx + 1} de {deck.totalCards}
              </span>
              <span>{progressPercent}% Explorados</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div
                className="bg-linear-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* O CARD INTERATIVO COM EFEITO FLIP 3D */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative min-h-[300px] sm:min-h-[360px] p-8 sm:p-12 rounded-3xl bg-linear-to-br from-slate-900/90 to-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-2xl cursor-pointer flex flex-col justify-between transition-all hover:border-indigo-500/40 select-none group"
            >
              {/* Marca D'Água / Categoria */}
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 font-mono text-[11px]">
                  {isFlipped ? "RESPOSTA" : "PERGUNTA"}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                  <RotateCw size={12} /> Clique para virar o card
                </span>
              </div>

              {/* CONTEÚDO PRINCIPAL DO CARD */}
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    <motion.div
                      key="front"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                        {currentCard.question}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4 max-w-xl"
                    >
                      <p className="text-lg sm:text-2xl font-black text-indigo-300 leading-relaxed">
                        {currentCard.answer}
                      </p>

                      {currentCard.details && (
                        <div className="mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 text-left flex items-start gap-2.5">
                          <Lightbulb
                            size={16}
                            className="text-amber-400 shrink-0 mt-0.5"
                          />
                          <div>
                            <strong className="block font-bold text-amber-300 mb-0.5">
                              Dica / Mnemônico:
                            </strong>
                            <span>{currentCard.details}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/5">
                <span>Synapse AI • Repetição Inteligente</span>
                <span>Use as setas para navegar</span>
              </div>
            </div>

            {/* CONTROLES DE NAVEGAÇÃO */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrev}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                title="Card Anterior"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCw size={15} />
                <span>{isFlipped ? "Ver Pergunta" : "Revelar Resposta"}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                title="Próximo Card"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900 rounded-3xl border border-white/5">
            <p className="text-slate-400 text-sm">
              Nenhum flashcard disponível neste baralho no momento.
            </p>
          </div>
        )}

        {/* 4. BANNER / CTA MAGNÉTICO DE CONVERSÃO */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900/50 via-violet-900/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles size={12} /> Turbinar com Inteligência Artificial
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Gostou deste baralho? Clone para sua conta!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                Estude estes {deck.totalCards} cartões com o algoritmo de{" "}
                <strong className="text-white">repetição espaçada inteligente</strong>, que agenda as
                revisões no momento exato em que você precisa relembrar.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {clonedSuccessId ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Baralho Clonado com Sucesso!
                  </div>
                  <Link
                    href={`/flashcards/study/${clonedSuccessId}`}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Começar a Estudar</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCloneDeck}
                  disabled={isCloning}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs transition-all shadow-xl shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCloning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Clonando para sua Biblioteca...</span>
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} />
                      <span>
                        {isLoggedIn
                          ? "⚡ Clonar para Minha Biblioteca"
                          : "Criar Conta e Clonar Baralho"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 5. FOOTER PÚBLICO MINIMALISTA */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>
          Synapse AI • A Plataforma Neural para Concursos Públicos e Alta
          Performance.
        </p>
      </footer>
    </div>
  );
}
