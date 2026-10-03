"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const FAQS = [
    {
      q: "Como o motor FSRS difere do algoritmo tradicional do Anki?",
      a: "O Anki tradicional utiliza o algoritmo SM-2 criado nos anos 80, que aplica intervalos de revisão fixos e gera acúmulo descontrolado de centenas de cards caso você falte alguns dias. O motor FSRS (Free Spaced Repetition Scheduler) do Synapse AI é baseado em modelagem contínua de memória (R = 0.9^{t/S}), calculando a probabilidade de esquecimento exata e reduzindo a carga diária de revisões em até 65% com a mesma retenção de 90%+ no dia da prova.",
    },
    {
      q: "Como funciona o áudio neural hands-free com a tela do celular bloqueada?",
      a: "O Synapse integra a API nativa MediaSession do navegador do seu smartphone. Você pode colocar os fones Bluetooth, dar o play e bloquear a tela no bolso. O app reproduzirá a pergunta com voz neural de estúdio, manterá uma pausa reflexiva inteligente (configurável de 3 a 8 segundos) para seu cérebro fazer a recuperação ativa mental, e em seguida pronunciará o gabarito oficial com o macete. Você pode usar os botões do próprio fone para pausar ou avançar.",
    },
    {
      q: "A correção de redação discursiva segue realmente o critério das bancas?",
      a: "Sim. Nossos prompts e critérios foram calibrados com os espelhos oficiais das maiores bancas do país (Cebraspe, FGV, FCC, Vunesp). O sistema aplica as fórmulas matemáticas reais de desconto (como a apenação por número de erros dividida pelo total de linhas no Cebraspe), analisa a Macroestrutura temática e a Microestrutura gramatical linha a linha, e ainda sugere a 'Versão Ouro' reescrita no padrão dos candidatos nota 10.",
    },
    {
      q: "Posso tirar foto da minha redação escrita à mão na folha de prova?",
      a: "Com certeza! Usamos o modelo multimodal Gemini Vision para OCR avançado de manuscrito. Basta fotografar a folha de resposta padrão com o celular ou webcam. O sistema digitaliza o texto preservando a numeração de linhas e parágrafos, identifica eventuais falhas de grafia ou rasura e avalia o conteúdo imediatamente.",
    },
    {
      q: "E se eu tiver um imprevisto e perder um dia de estudos?",
      a: "O Synapse possui um Ciclo Adaptativo Anti-Culpa. Diferente de planilhas de Excel ou cronogramas estáticos que viram uma montanha de matéria atrasada, o algoritmo redistribui suavemente os minutos do dia perdido entre as próximas sessões da semana. Sua meta se reorganiza sem estresse e sem sobrecarga.",
    },
    {
      q: "O Synapse funciona em celulares Android e iPhone?",
      a: "Sim! A plataforma é uma Progressive Web App (PWA) de última geração com design mobile-first responsivo. Você pode usá-la no navegador do Chrome ou Safari ou adicioná-la à tela de início do seu smartphone com 1 clique para uma experiência idêntica a um app nativo, com suporte a áudio em segundo plano.",
    },
    {
      q: "Existe garantia de reembolso?",
      a: "Sim. Confiamos 100% no impacto cognitivo da metodologia. Você tem 7 dias de garantia incondicional no plano Synapse Pro. Se por qualquer motivo sentir que o ecossistema não acelerou seus estudos, basta solicitar o estorno com 1 clique.",
    },
  ];

  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712]">
      {/* Glow Divisor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tira-Dúvidas</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Perguntas Frequentes
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Tudo o que você precisa saber sobre a tecnologia, áudio hands-free e a neurociência por trás do Synapse AI.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 sm:mt-16 space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? "bg-slate-900/80 border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-white leading-snug">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isOpen
                        ? "bg-indigo-500/20 border-indigo-400 text-indigo-300 rotate-180"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 sm:px-6 sm:pb-7 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.05] pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
