"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck2,
  Headphones,
  Brain,
  ScanText,
  BookmarkX,
  Target,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Award,
  Zap,
  Volume2,
  ArrowRight,
  Flame,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import Link from "next/link";

export function ArsenalBentoGrid() {
  // Estado Card 1: Discursiva Banca Selector & Comparison Mode
  const [selectedBanca, setSelectedBanca] = useState<"cebraspe" | "fgv" | "fcc">("cebraspe");
  const [redacaoMode, setRedacaoMode] = useState<"draft" | "gold">("gold");

  // Estado Card 2: Audio Player Simulator
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioStep, setAudioStep] = useState<"question" | "thinking" | "answer">("question");
  const [thinkingSeconds, setThinkingSeconds] = useState(3);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAudio) {
      if (audioStep === "question") {
        timer = setTimeout(() => {
          setAudioStep("thinking");
          setThinkingSeconds(3);
        }, 3000);
      } else if (audioStep === "thinking") {
        if (thinkingSeconds > 1) {
          timer = setTimeout(() => {
            setThinkingSeconds((prev) => prev - 1);
          }, 1000);
        } else {
          timer = setTimeout(() => {
            setAudioStep("answer");
          }, 1000);
        }
      } else if (audioStep === "answer") {
        timer = setTimeout(() => {
          setIsPlayingAudio(false);
          setAudioStep("question");
          setThinkingSeconds(3);
        }, 5000);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlayingAudio, audioStep, thinkingSeconds]);

  // Estado Card 3: FSRS Simulator
  const [fsrsGrade, setFsrsGrade] = useState<"again" | "hard" | "good" | "easy">("good");

  const getFsrsInterval = () => {
    switch (fsrsGrade) {
      case "again":
        return { interval: "Hoje (10 min)", stability: "0.8 dias", retention: "82%" };
      case "hard":
        return { interval: "+3 dias", stability: "3.5 dias", retention: "89%" };
      case "good":
        return { interval: "+14 dias", stability: "16.2 dias", retention: "94%" };
      case "easy":
        return { interval: "+32 dias", stability: "38.5 dias", retention: "98%" };
    }
  };

  const currentFsrs = getFsrsInterval();

  return (
    <section id="arsenal" className="relative py-24 sm:py-32 overflow-hidden bg-[#030712]">
      {/* Background Neon Glows Cinematográficos */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-indigo-500/12 via-violet-500/12 to-cyan-500/8 blur-[160px] -z-10" />

      {/* Grade Cósmica Estelar */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>O Arsenal Cognitivo</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Ferramentas cirúrgicas projetadas para a{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              posse no cargo público
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Cada recurso do Synapse AI foi desenvolvido com um único objetivo: maximizar seus pontos líquidos por hora estudada no edital.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ========================================================================= */}
          {/* CARD 1 (DESTAQUE HERO 2 COLS): ANALISTA DE REDAÇÃO DISCURSIVA              */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2 rounded-3xl bg-gradient-to-b from-violet-950/30 via-slate-950/70 to-black/90 border border-violet-500/30 p-6 sm:p-8 space-y-6 relative overflow-hidden group hover:border-violet-500/50 transition-all shadow-[0_15px_40px_rgba(139,92,246,0.1)]"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header do Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet-400 font-bold block">
                    Destaque de Aprovação
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Analista de Redação Discursiva da Banca
                  </h3>
                </div>
              </div>
            </div>

            {/* Controles: Seletor de Modo (Antes vs Depois) & Seletor de Banca */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Comparador Antes vs Depois */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRedacaoMode("draft")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    redacaoMode === "draft"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Rascunho Inicial (62 pts)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRedacaoMode("gold")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    redacaoMode === "gold"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Versão Ouro Synapse (96.4 pts)</span>
                </button>
              </div>

              {/* Seletor de Banca */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedBanca("cebraspe")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBanca === "cebraspe"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cebraspe
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBanca("fgv")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBanca === "fgv"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  FGV
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBanca("fcc")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBanca === "fcc"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  FCC
                </button>
              </div>
            </div>

            {/* Descrição */}
            <p className="text-sm text-slate-300 leading-relaxed">
              Chega de feedbacks genéricos de professores particulares que levam dias para responder. O Synapse calcula sua nota oficial com as fórmulas reais da banca e gera a <strong className="text-white">Versão Ouro</strong> para você aprender a escrever no padrão nota máxima.
            </p>

            {/* Live Interactive Evaluation Simulator */}
            <div className="rounded-2xl bg-black/60 border border-white/[0.08] p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-violet-300 font-bold">
                    {selectedBanca === "cebraspe" && "Fórmula Cebraspe: NF = NC - 2 × (NE / TL)"}
                    {selectedBanca === "fgv" && "Critério FGV: Conteúdo Temático (50%) + Coesão & Gramática (50%)"}
                    {selectedBanca === "fcc" && "Critério FCC: Estrutura Dissertativa (40 pts) + Expressão Formal (60 pts)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Nota Simulada:</span>
                  <span className={`text-lg font-black font-mono ${redacaoMode === "gold" ? "text-emerald-400" : "text-rose-400"}`}>
                    {redacaoMode === "gold"
                      ? (selectedBanca === "cebraspe" ? "96.4 / 100" : selectedBanca === "fgv" ? "9.6 / 10" : "95.0 / 100")
                      : (selectedBanca === "cebraspe" ? "62.0 / 100" : selectedBanca === "fgv" ? "6.2 / 10" : "60.0 / 100")}
                  </span>
                </div>
              </div>

              {/* Linha a linha com apontamento de erro / versão ouro */}
              <div className="space-y-2 text-xs">
                {redacaoMode === "draft" ? (
                  <>
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                        <span className="text-rose-400 font-bold">Linha 12 • Erro de Regência Verbal</span>
                        <span className="text-rose-400/80">-2.0 pts Microestrutura</span>
                      </div>
                      <p className="text-slate-300 font-mono">
                        &quot;...a nova portaria ministerial <del className="text-rose-400 bg-rose-500/10 px-1 rounded">implica em restrições</del> à ampla concorrência...&quot;
                      </p>
                      <p className="text-rose-300 font-mono text-[11px] pt-1">
                        ↳ Falha Grave: O verbo &quot;implicar&quot; no sentido de acarretar é transitivo direto (não aceita &quot;em&quot;).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                        <span className="text-rose-400 font-bold">Macroestrutura • Tópico 2.1 Incompleto</span>
                        <span className="text-rose-400/80">-15.0 pts Tema</span>
                      </div>
                      <p className="text-slate-300">
                        O candidato tangenciou o tema ao deixar de citar a tese de repercussão geral pacificada no STF, recebendo pontuação mínima no espelho oficial.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">Linha 12 • Regência Impecável & Coesão</span>
                        <span className="text-emerald-400/80">Microestrutura Nota Máxima</span>
                      </div>
                      <p className="text-slate-300 font-mono">
                        &quot;...a referida portaria ministerial <strong className="text-emerald-300 bg-emerald-500/10 px-1 rounded">implica restrições</strong> estritas à livre concorrência...&quot;
                      </p>
                      <p className="text-emerald-300 font-mono text-[11px] pt-1">
                        ↳ Versão Ouro: Adequação sintática ao padrão culto e vocabulário técnico de auditoria.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">Macroestrutura • Tópico 2.1 Gabaritado</span>
                        <span className="text-emerald-400/80">30.0 / 30.0 pts</span>
                      </div>
                      <p className="text-slate-300">
                        Fundamentação jurídica sólida citando a Lei 14.133/21 e o Tema 899/STF, estruturada em parágrafo padrão com conectivos argumentativos de alta densidade.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Correção em 10 segundos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Foto da folha manuscrita (OCR)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Espelho de resposta oficial</span>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* CARD 2 (DESTAQUE DE PRODUTIVIDADE 2 COLS): ÁUDIO NEURAL HANDS-FREE         */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-2 rounded-3xl bg-gradient-to-b from-cyan-950/30 via-slate-950/70 to-black/90 border border-cyan-500/30 p-6 sm:p-8 space-y-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-[0_15px_40px_rgba(6,182,212,0.1)]"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header do Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                    Produtividade Extrema
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Flashcards em Áudio 100% Humanizado (Hands-Free)
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono font-bold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>MediaSession API (Tela Bloqueada)</span>
              </div>
            </div>

            {/* Descrição */}
            <p className="text-sm text-slate-300 leading-relaxed">
              Transforme o trânsito, o treino na academia e as tarefas domésticas em horas líquidas de estudo. O Synapse lê o flashcard com vozes neurais de estúdio, dá uma <strong className="text-white">pausa reflexiva</strong> para o seu cérebro recuperar ativamente a resposta, e fala o gabarito com macetes práticos.
            </p>

            {/* Interactive Audio Player Experience */}
            <div className="rounded-2xl bg-black/60 border border-cyan-500/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingAudio(!isPlayingAudio);
                      if (!isPlayingAudio) setAudioStep("question");
                    }}
                    className="w-11 h-11 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
                  </button>

                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-300 block">
                      {isPlayingAudio ? (
                        audioStep === "question" ? "🔊 Falando a Pergunta..." :
                        audioStep === "thinking" ? `⏳ Pausa Reflexiva (${thinkingSeconds}s)... Pense na resposta!` :
                        "🎯 Falando o Gabarito & Macete..."
                      ) : (
                        "Clique em Play para testar o Áudio Neural"
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Direito Constitucional • Direitos e Garantias Fundamentais
                    </span>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono text-cyan-400 font-bold block">Controles do Fone</span>
                  <span className="text-[10px] text-slate-500 font-mono">Play / Pause / Next</span>
                </div>
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1.5 h-10 px-4 py-1 bg-slate-950/70 rounded-xl border border-white/5">
                {[30, 60, 90, 45, 75, 100, 80, 50, 85, 95, 40, 70, 60, 90, 30].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={isPlayingAudio ? { height: [`${h * 0.25}%`, `${h}%`, `${h * 0.35}%`] } : { height: "20%" }}
                    transition={{ duration: 0.6 + (i % 4) * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-1.5 rounded-full transition-colors ${
                      isPlayingAudio
                        ? audioStep === "thinking"
                          ? "bg-amber-400"
                          : "bg-cyan-400"
                        : "bg-slate-700"
                    }`}
                    style={{ height: isPlayingAudio ? `${h}%` : "20%" }}
                  />
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5 text-xs font-mono">
                {audioStep === "question" && (
                  <p className="text-slate-200">
                    <strong>Synapse Voz Neural:</strong> &quot;O mandado de segurança coletivo pode ser impetrado por partido político com representação no Congresso Nacional?&quot;
                  </p>
                )}
                {audioStep === "thinking" && (
                  <p className="text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <strong>Recuperação Ativa:</strong> Recupere a resposta no seu pensamento antes que o áudio continue... ({thinkingSeconds}s)
                  </p>
                )}
                {audioStep === "answer" && (
                  <p className="text-emerald-300">
                    <strong>Gabarito Oficial:</strong> &quot;Sim! Conforme Art. 5º, LXX, &apos;a&apos; da CF/88. Macete: basta um único parlamentar em qualquer uma das casas para legitimar a impetração!&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Footer Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Zero telas: ouça na esteira ou volante</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Pausa reflexiva inteligente (3 a 8s)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Vozes sem robótica (Edge Neural)</span>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* CARD 3 (DESTAQUE LARGO): MOTOR FSRS & CURVA DO ESQUECIMENTO               */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2 lg:col-span-3 rounded-3xl bg-gradient-to-b from-indigo-950/30 via-slate-950/70 to-black/90 border border-indigo-500/30 p-6 sm:p-8 space-y-6 relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-[0_15px_40px_rgba(99,102,241,0.1)]"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                    O Cérebro Matemático
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Motor FSRS: Curva do Esquecimento Domada
                  </h3>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/10">
                Retenção Desejada Calibrada: <strong className="text-emerald-400 font-bold">90% no Dia D</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Enquanto métodos arcaicos fazem você revisar matérias que já domina ou deixam conteúdos difíceis caírem no esquecimento, o motor preditivo <strong className="text-white">FSRS</strong> calcula o momento exato antes da perda de memória para agendar revisões cirúrgicas.
                </p>

                {/* Interactive Rating Simulator */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    Teste a calibração do algoritmo na hora:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setFsrsGrade("again")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        fsrsGrade === "again"
                          ? "bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md shadow-rose-500/20"
                          : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs block font-bold">Errei (1)</span>
                      <span className="text-[10px] font-mono opacity-80">Reset imediato</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFsrsGrade("hard")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        fsrsGrade === "hard"
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/20"
                          : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs block font-bold">Difícil (2)</span>
                      <span className="text-[10px] font-mono opacity-80">Com esforço</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFsrsGrade("good")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        fsrsGrade === "good"
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold shadow-md shadow-indigo-500/20"
                          : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs block font-bold">Bom (3)</span>
                      <span className="text-[10px] font-mono opacity-80">Ritmo ideal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFsrsGrade("easy")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        fsrsGrade === "easy"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20"
                          : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs block font-bold">Fácil (4)</span>
                      <span className="text-[10px] font-mono opacity-80">Imediato</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Output Box */}
              <div className="rounded-2xl bg-black/60 border border-indigo-500/30 p-5 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-white/10">
                  <span>Próxima Revisão:</span>
                  <span className="text-emerald-400 font-bold text-sm">{currentFsrs.interval}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-white/10">
                  <span>Estabilidade (S):</span>
                  <span className="text-cyan-300 font-bold">{currentFsrs.stability}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Retenção Estimada:</span>
                  <span className="text-indigo-300 font-bold">{currentFsrs.retention}</span>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 font-sans">
                  💡 <strong>Fato Científico:</strong> O FSRS reduz o volume diário de cards em 65% sem perder um único ponto na prova.
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* CARD 4: SCANNER OCR DE QUESTÕES DE APOSTILA/LIVRO                          */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl bg-gradient-to-b from-slate-900/60 to-black/80 border border-white/[0.08] p-6 space-y-5 hover:border-cyan-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <ScanText className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Multimodal Vision
              </span>
              <h4 className="text-lg font-bold text-white">
                Scanner OCR de Apostilas & Livros
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tirou foto de um exercício na apostila ou printou um PDF no celular? O Synapse digitaliza o enunciado, resolve a questão, aponta a pegadinha da banca e gera o flashcard sem você digitar nada.
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 relative overflow-hidden">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 left-0 animate-pulse" />
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                <span>[SCANNER LASER ATIVO]</span>
                <span className="text-emerald-400 font-bold">Gabarito: Letra C</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Pegadinha detectada: &quot;salvo disposição em contrário&quot; altera a regra geral da questão.
              </p>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* CARD 5: CADERNO DE ERROS COM TAXONOMIA COGNITIVA                           */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl bg-gradient-to-b from-slate-900/60 to-black/80 border border-white/[0.08] p-6 space-y-5 hover:border-amber-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <BookmarkX className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Taxonomia da Falha
              </span>
              <h4 className="text-lg font-bold text-white">
                Caderno de Erros com Causa-Raiz
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Errar sem diagnosticar o motivo é garantir o erro na prova. O Synapse classifica automaticamente cada falha entre <strong className="text-white">Lacuna Teórica, Pegadinha, Falta de Atenção ou Interpretação</strong>.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
                • Teoria Nova (Lacuna)
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                • Pegadinha da Banca
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                • Interpretação
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                • Pressão de Tempo
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* CARD 6: RADAR DE DOMÍNIO VS PESO DO CONCURSO & ÁRVORE RPG                  */}
          {/* ========================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-3xl bg-gradient-to-b from-slate-900/60 to-black/80 border border-white/[0.08] p-6 space-y-5 hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Estratégia & Gamificação
              </span>
              <h4 className="text-lg font-bold text-white">
                Radar de Domínio vs. Peso & RPG
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Descubra onde estão os pontos fáceis que você está deixando na mesa. Cruzamos sua taxa de acerto com o peso real do edital e transformamos cada matéria em nós de uma árvore RPG com níveis e recompensas.
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold">Direito Constitucional</span>
                <span className="text-emerald-400 font-bold">Nível 8 (Mestre)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5">
                <div className="h-full rounded-full bg-emerald-400 w-[88%]" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Peso no Edital: 20%</span>
                <span className="text-cyan-300">+450 XP Ganho</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
