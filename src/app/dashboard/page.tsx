"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import PomodoroTimer from "@/components/pomodoro-timer";
import SubjectCard from "@/components/subject-card";
import { NewContentModal } from "@/components/create-subject-modal";
import SubjectCardSkeleton from "@/components/subject-card-skeleton";
import { useSidebar } from "@/lib/sidebar-context";
import { ReviewTopic, DashboardSubject } from "@/types";
import {
  Menu,
  BookOpen,
  Flame,
  Sparkles,
  CheckCircle2,
  BarChart3,
  ClipboardList,
  Loader2,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";
import Heatmap from "@/components/analytics/Heatmap";

export default function Dashboard() {
  const { openSidebar } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🧠 ESTADOS PARA A FILA DE REVISÃO DO SM-2
  const [reviewQueue, setReviewQueue] = useState<ReviewTopic[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  // Lista de matérias
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);

  // 1. Carrega os dados do banco
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setIsLoadingQueue(true);

        const [resSubjects, resQueue] = await Promise.all([
          fetch("/api/planner?mode=subjects", { cache: "no-store" }),
          fetch("/api/planner?mode=review", { cache: "no-store" }),
        ]);

        if (!isMounted) return;

        if (resSubjects.ok) {
          const jsonSubjects = await resSubjects.json();
          setSubjects(
            Array.isArray(jsonSubjects.data) ? jsonSubjects.data : [],
          );
        }

        if (resQueue.ok) {
          const jsonQueue = await resQueue.json();
          setReviewQueue(Array.isArray(jsonQueue.data) ? jsonQueue.data : []);
        }
      } catch (err) {
        console.error("Erro ao carregar os dados do Dashboard:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingQueue(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReview = async (
    topicId: string,
    grade: "Bom" | "Difícil" | "Errei",
  ) => {
    try {
      setUpdatingTopicId(topicId);

      const performance = grade === "Bom" ? 100 : grade === "Difícil" ? 60 : 20;

      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          grade,
          performance,
        }),
      });

      if (response.ok) {
        setReviewQueue((prev) => prev.filter((topic) => topic.id !== topicId));
      }
    } catch (err) {
      console.error("Erro ao enviar revisão:", err);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleCreateContent = async (data: {
    title: string;
    subjectName: string;
    weight: string;
  }) => {
    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erro ao criar conteúdo");

      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar tópico:", error);
    }
  };

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ================= HEADER / PAINEL DE JORNADA ================= */}
        <header className="w-full bg-slate-900/40 border border-white/10 rounded-2xl p-5 mb-8 shadow-xl shadow-indigo-950/10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                268 dias{" "}
                <span className="text-slate-500 font-medium text-base">
                  até o grande objetivo
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Faltam aproximadamente 38 semanas e 2 dias
              </p>
            </div>

            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest">
              Status: Em progresso
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span>Início da jornada</span>
              <span className="text-indigo-400 font-mono">15% concluído</span>
            </div>

            <div className="relative h-3 w-full bg-slate-950 rounded-full border border-slate-900/50 p-0.5 overflow-visible">
              <div className="absolute inset-0 bg-indigo-500/20 blur-sm rounded-full" />
              <div className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full w-[15%] relative z-10 shadow-[0_0_15px_rgba(79,70,229,0.6)]" />
            </div>
          </div>
        </header>

        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="p-2 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 md:hidden transition-colors"
          >
            <Menu size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Bem-vindo de volta, parceiro!
            </p>
          </div>
        </div>

        {/* ================= GRADE PRINCIPAL (GRID) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SEÇÃO ESQUERDA + CENTRAL (Colunas 1 a 9) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Bloco Superior: Revisões e Progresso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD 1: Fila de Revisões */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden min-h-55 flex flex-col justify-between">
                {isLoadingQueue ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2">
                    <Loader2
                      size={24}
                      className="animate-spin text-indigo-400"
                    />
                    <span className="text-xs">
                      Sincronizando curva de esquecimento...
                    </span>
                  </div>
                ) : reviewQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-6 group">
                    <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-full border border-emerald-500/20 mb-3 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="font-semibold text-slate-200">
                      Tudo em dia!
                    </h3>
                    <p className="text-xs text-slate-400 max-w-60 mt-1.5 leading-relaxed">
                      Nenhuma revisão programada para hoje. Continue assim!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-between flex-1 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertCircle size={14} /> Revisões de Hoje
                      </span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold">
                        {reviewQueue.length}{" "}
                        {reviewQueue.length === 1 ? "tópico" : "tópicos"}
                      </span>
                    </div>

                    <div className="py-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                        {reviewQueue[0].subject?.name || "Matéria"}
                      </span>
                      <h4 className="text-base font-bold text-slate-100 mt-0.5 line-clamp-1">
                        {reviewQueue[0].title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {reviewQueue[0].firstStudy === "Pendente"
                          ? "🌱 Assunto novo! Faça seu primeiro estudo e avalie seu domínio."
                          : "⏱️ Tempo limite atingido! Revise o assunto para consolidar a memória."}
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                        Como foi seu desempenho?
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          disabled={updatingTopicId !== null}
                          onClick={() =>
                            handleReview(reviewQueue[0].id, "Errei")
                          }
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          {updatingTopicId === reviewQueue[0].id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            "Errei 👎"
                          )}
                        </button>

                        <button
                          disabled={updatingTopicId !== null}
                          onClick={() =>
                            handleReview(reviewQueue[0].id, "Difícil")
                          }
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-xs py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          {updatingTopicId === reviewQueue[0].id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            "Difícil ✊"
                          )}
                        </button>

                        <button
                          disabled={updatingTopicId !== null}
                          onClick={() => handleReview(reviewQueue[0].id, "Bom")}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          {updatingTopicId === reviewQueue[0].id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            "Fácil 👍"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: Métricas de Desempenho */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium text-slate-200 tracking-wide">
                    Métricas de Desempenho
                  </span>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                    Live Stats
                  </span>
                </div>

                <div className="flex gap-8 mb-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">
                      Tempo Total
                    </span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white to-indigo-300">
                      4h 20m
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase mb-1">
                      <span>Precisão</span>
                      <span>78%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 w-[78%]" />
                      <div className="bg-rose-500 w-[22%]" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-5 mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-600 uppercase font-semibold">
                      Sessões
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      12
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-600 uppercase font-semibold">
                      Questões
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      145
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-600 uppercase font-semibold">
                      Méd/Dia
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      35min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 MOTOR DE SUGESTÕES POR IA */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-cyan-500/30">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] transition-all duration-700 group-hover:bg-cyan-500/20" />

              <div className="relative flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-cyan-500/10 p-1.5 ring-1 ring-cyan-500/20">
                    <Sparkles
                      size={16}
                      className="text-cyan-400 animate-pulse"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Sugestões de estudos
                  </h3>
                </div>
                <span className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  Synapse Core v1
                </span>
              </div>

              <div className="space-y-3">
                <div className="group/item relative flex items-start gap-4 rounded-xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-400/30 hover:bg-slate-900/40">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                    <BrainCircuit size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-200">
                      Rever Raciocínio Lógico
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sua retenção caiu para 68%. O algoritmo sugere revisar 8
                      cards.
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold tracking-widest text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                    CRÍTICO
                  </span>
                </div>

                <div className="group/item relative flex items-start gap-4 rounded-xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-slate-900/40">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <ClipboardList size={20} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-200">
                        Fixação Teórica: Português
                      </span>
                      <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-emerald-400 border border-emerald-500/20 bg-emerald-500/5">
                        Sugerido
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Você atingiu 82% de precisão em Sintaxe! Desbloqueie o{" "}
                      <span className="font-medium text-slate-200">
                        Caderno Avançado
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-t border-white/5 bg-white/5 py-2.5 text-xs font-medium text-slate-400 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 active:scale-[0.98]">
                <Sparkles size={13} />
                <span>Otimizar Cronograma com IA</span>
              </button>
            </div>

            {/* CARD 4: Lista de Matérias */}
            <div className="bg-slate-900/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <BookOpen size={16} className="text-slate-400" />
                  </div>
                  <h3 className="font-medium text-xs text-slate-300 tracking-[0.2em] uppercase">
                    Minhas Matérias
                  </h3>
                </div>
              </div>

              {/* Grid Responsiva com Animação do Framer Motion */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <SubjectCardSkeleton key={i} />
                  ))}
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 bg-white/5 border border-white/5 rounded-xl">
                  <p className="text-xs text-slate-400">
                    Nenhuma matéria cadastrada ainda.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 text-xs text-indigo-400 font-bold hover:underline"
                  >
                    + Criar minha primeira matéria
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {subjects.map((sub) => (
                    <motion.div key={sub.id} variants={itemVariants}>
                      <Link href={`/planner?subjectId=${sub.id}`}>
                        <SubjectCard
                          title={sub.name}
                          colorClass={sub.color || "#3B82F6"}
                          progress={sub.progress ?? 0}
                          accuracy={sub.accuracy ?? 0}
                          timeSpent={sub.timeSpent ?? "0min"}
                          totalCards={sub._count?.topics ?? 0}
                        />
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* ================= SEÇÃO DIREIRA (BARRA LATERAL) ================= */}
          <div className="lg:col-span-3 space-y-6">
            {/* CARD DE CONSTÂNCIA */}
            <Link
              href="/analytics"
              className="bg-slate-900/40 border border-white/10 hover:border-indigo-500/30 p-5 rounded-2xl transition-all duration-300 block group cursor-pointer shadow-lg relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    Constância
                  </h3>
                  <p className="text-2xl font-black text-slate-100 mt-1">
                    5 Dias
                  </p>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
                  <Flame size={18} />
                </div>
              </div>

              <div className="flex gap-1.5 justify-between pt-2">
                {["S", "T", "Q", "Q", "S", "S", "D"].map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        idx < 5
                          ? "bg-linear-to-br from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/10"
                          : "bg-slate-950 border border-slate-900 text-slate-600"
                      }`}
                    >
                      {day}
                    </div>
                  </div>
                ))}
              </div>
            </Link>

            {/* CARD DE META SEMANAL */}
            <Link
              href="/analytics"
              className="bg-slate-900/40 border border-white/10 hover:border-indigo-500/30 p-5 rounded-2xl transition-all duration-300 block group cursor-pointer shadow-lg"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    Meta Semanal
                  </h3>
                  <p className="text-2xl font-black text-slate-100 mt-1">
                    78.7%
                  </p>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-105 transition-transform">
                  <BarChart3 size={18} />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="h-2 w-full bg-slate-950 rounded-full relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-md opacity-30 rounded-full" />
                  <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full w-[78.7%] relative z-10" />
                </div>

                <span className="text-[10px] text-slate-500 block text-right font-medium">
                  Meta semanal: 85%
                </span>
              </div>
            </Link>

            <section>
              <Heatmap />
            </section>

            <PomodoroTimer />
          </div>
        </div>
      </div>

      <NewContentModal
        isOpen={isModalOpen}
        subjects={subjects.map((s) => ({ id: s.name, name: s.name }))}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateContent}
      />
    </div>
  );
}
