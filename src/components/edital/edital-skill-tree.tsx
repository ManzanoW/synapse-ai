"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  ShieldAlert,
  Trophy,
  Crown,
  Lock,
  Search,
  Filter,
  ArrowRight,
  Zap,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  X,
  Clock,
  Flame,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MindMapModal } from "@/components/mindmap/MindMapModal";

export interface SkillTreeTopic {
  id: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  performance?: number;
  firstStudy?: string;
  nextRev?: string;
  lastRev?: string;
  relevance?: string;
  interval?: number;
}

export interface SkillTreeSubject {
  id: string;
  name: string;
  color?: string | null;
  weight?: number;
  topics?: Array<{
    id: string;
    title: string;
    performance?: number;
    firstStudy?: string;
    nextRev?: string;
    lastRev?: string;
  }>;
}

interface EditalSkillTreeProps {
  subjects: SkillTreeSubject[];
  topics: SkillTreeTopic[];
  onReviewClick?: (topicId: string) => void;
}

type MasteryTier = "LOCKED" | "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

interface TopicMasteryInfo {
  tier: MasteryTier;
  label: string;
  badgeColor: string;
  glowColor: string;
  textColor: string;
  borderColor: string;
  fillColor: string;
  isDecaying: boolean;
}

function getTopicMastery(t: SkillTreeTopic): TopicMasteryInfo {
  const perf = t.performance || 0;
  const isPending = !t.firstStudy || t.firstStudy === "Pendente";
  const now = new Date();
  const isDecaying =
    Boolean(t.nextRev && new Date(t.nextRev) <= now && perf >= 70);

  if (isPending && perf === 0) {
    return {
      tier: "LOCKED",
      label: "Não Iniciado",
      badgeColor: "bg-slate-800/80 text-slate-400 border-slate-700/80",
      glowColor: "rgba(100, 116, 139, 0.15)",
      textColor: "text-slate-500",
      borderColor: "border-slate-800",
      fillColor: "#090d16",
      isDecaying: false,
    };
  }

  if (perf >= 95) {
    return {
      tier: "DIAMOND",
      label: "Diamante • Mestre",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/20",
      glowColor: "rgba(6, 182, 212, 0.45)",
      textColor: "text-cyan-300",
      borderColor: "border-cyan-500/60",
      fillColor: "#083344",
      isDecaying,
    };
  }

  if (perf >= 85) {
    return {
      tier: "GOLD",
      label: "Ouro • Avançado",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/20",
      glowColor: "rgba(245, 158, 11, 0.4)",
      textColor: "text-amber-300",
      borderColor: "border-amber-500/60",
      fillColor: "#451a03",
      isDecaying,
    };
  }

  if (perf >= 70) {
    return {
      tier: "SILVER",
      label: "Prata • Competente",
      badgeColor: "bg-slate-300/20 text-slate-200 border-slate-300/40",
      glowColor: "rgba(203, 213, 225, 0.3)",
      textColor: "text-slate-200",
      borderColor: "border-slate-400/60",
      fillColor: "#1e293b",
      isDecaying,
    };
  }

  return {
    tier: "BRONZE",
    label: "Bronze • Aprendiz",
    badgeColor: "bg-orange-700/20 text-orange-300 border-orange-600/40",
    glowColor: "rgba(194, 65, 12, 0.3)",
    textColor: "text-orange-300",
    borderColor: "border-orange-600/50",
    fillColor: "#2c1208",
    isDecaying: false,
  };
}

export function EditalSkillTree({
  subjects,
  topics,
  onReviewClick,
}: EditalSkillTreeProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = useState<SkillTreeTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mindMapTarget, setMindMapTarget] = useState<{
    topicTitle: string;
    subjectName: string;
    topicId?: string;
    color?: string;
  } | null>(null);

  // Tópicos agrupados por disciplina
  const groupedData = useMemo(() => {
    return subjects.map((sub) => {
      const subTopics = topics.filter(
        (t) =>
          t.subjectId === sub.id ||
          t.subjectName?.toLowerCase() === sub.name.toLowerCase()
      );
      const avgPerf =
        subTopics.length > 0
          ? Math.round(
              subTopics.reduce((acc, t) => acc + (t.performance || 0), 0) /
                subTopics.length
            )
          : 0;

      return {
        subject: sub,
        topics: subTopics,
        averagePerformance: avgPerf,
      };
    });
  }, [subjects, topics]);

  // Estatísticas globais da Constelação
  const stats = useMemo(() => {
    let locked = 0;
    let bronze = 0;
    let silver = 0;
    let gold = 0;
    let diamond = 0;
    let decaying = 0;

    topics.forEach((t) => {
      const m = getTopicMastery(t);
      if (m.tier === "LOCKED") locked++;
      else if (m.tier === "BRONZE") bronze++;
      else if (m.tier === "SILVER") silver++;
      else if (m.tier === "GOLD") gold++;
      else if (m.tier === "DIAMOND") diamond++;

      if (m.isDecaying) decaying++;
    });

    const masteredCount = silver + gold + diamond;
    const total = topics.length || 1;
    const progressPercent = Math.round((masteredCount / total) * 100);

    return {
      total: topics.length,
      locked,
      bronze,
      silver,
      gold,
      diamond,
      decaying,
      masteredCount,
      progressPercent,
    };
  }, [topics]);

  // Filtragem
  const filteredGroups = useMemo(() => {
    return groupedData
      .filter((g) => {
        if (selectedSubjectId !== "ALL" && g.subject.id !== selectedSubjectId) {
          return false;
        }
        return true;
      })
      .map((g) => {
        if (!searchQuery.trim()) return g;
        const q = searchQuery.toLowerCase();
        return {
          ...g,
          topics: g.topics.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              g.subject.name.toLowerCase().includes(q)
          ),
        };
      })
      .filter((g) => g.topics.length > 0 || !searchQuery.trim());
  }, [groupedData, selectedSubjectId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER DA CONSTELAÇÃO: VISÃO PANORÂMICA RPG */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#070b16] via-[#0b1022] to-[#080d1a] border border-indigo-500/30 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider font-mono">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Árvore de Domínio RPG</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Constelação de Habilidades do Edital
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cada tópico do edital é um nó estelar. Conquiste 70%+ de acertos em questões para promover o nó a Prata, 85% para Ouro e 95% para Diamante Cósmico.
            </p>
          </div>

          {/* Placar de Níveis e Ebbinghaus */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 border border-slate-800/90 p-3.5 rounded-2xl backdrop-blur-md">
            <div className="text-center px-2">
              <div className="text-xs font-mono font-black text-cyan-300 flex items-center justify-center gap-1">
                <Crown size={14} className="text-cyan-400" />
                {stats.diamond}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Diamante</span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center px-2">
              <div className="text-xs font-mono font-black text-amber-300 flex items-center justify-center gap-1">
                <Trophy size={14} className="text-amber-400" />
                {stats.gold}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Ouro</span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center px-2">
              <div className="text-xs font-mono font-black text-slate-200 flex items-center justify-center gap-1">
                <Shield size={14} className="text-slate-300" />
                {stats.silver}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Prata</span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center px-2">
              <div className="text-xs font-mono font-black text-orange-400 flex items-center justify-center gap-1">
                <Shield size={14} className="text-orange-500" />
                {stats.bronze}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Bronze</span>
            </div>

            {stats.decaying > 0 && (
              <>
                <div className="h-6 w-px bg-slate-800" />
                <div className="text-center px-2 animate-pulse">
                  <div className="text-xs font-mono font-black text-rose-400 flex items-center justify-center gap-1">
                    <ShieldAlert size={14} className="text-rose-400" />
                    {stats.decaying}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-rose-400">Em Declínio</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Barra de Progresso da Galáxia */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full sm:max-w-md space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>Domínio da Galáxia do Concurso</span>
              <span className="text-cyan-400 font-mono font-bold">
                {stats.masteredCount} / {stats.total} nós ({stats.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm shadow-cyan-500/50"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Nós com pulso âmbar requerem reforço de retenção (Ebbinghaus)</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA RÁPIDA DE NÓS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl backdrop-blur-xl">
        {/* Pílulas de Matérias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
          <button
            onClick={() => setSelectedSubjectId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedSubjectId === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Todas as Matérias ({subjects.length})
          </button>
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sub.color || "#6366f1" }}
                />
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Input de Busca de Nó */}
        <div className="relative min-w-48 sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nó estelar..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* GRADE DAS CONSTELAÇÕES POR DISCIPLINA */}
      <div className="space-y-8">
        {filteredGroups.map((group) => {
          const subColor = group.subject.color || "#6366f1";

          return (
            <div
              key={group.subject.id}
              className="relative rounded-3xl bg-[#060913]/90 border border-slate-800/90 p-5 sm:p-7 backdrop-blur-xl shadow-xl space-y-6 overflow-hidden"
            >
              {/* Efeito Glow da Matéria */}
              <div
                className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: subColor }}
              />

              {/* Núcleo Estelar da Matéria (Cosmic Core) */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-lg relative overflow-hidden border border-white/20"
                    style={{ backgroundColor: subColor }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    <Sparkles size={20} className="relative z-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        {group.subject.name}
                      </h3>
                      {group.subject.weight && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold">
                          Peso {group.subject.weight.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {group.topics.length} tópicos mapeados • Domínio médio:{" "}
                      <strong className="text-indigo-300 font-bold">
                        {group.averagePerformance}%
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {
                      group.topics.filter(
                        (t) => (t.performance || 0) >= 70
                      ).length
                    }{" "}
                    / {group.topics.length} nós dominados
                  </span>
                </div>
              </div>

              {/* Grade de Nós Estelares da Disciplina */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
                {group.topics.map((t, idx) => {
                  const mastery = getTopicMastery(t);
                  const isSelected = selectedTopic?.id === t.id;

                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTopic(t)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? "bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/20"
                          : "bg-slate-950/60 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                      }`}
                      style={{
                        boxShadow: isSelected
                          ? `0 0 20px ${mastery.glowColor}`
                          : undefined,
                      }}
                    >
                      {/* Alerta de Ebbinghaus (Borda pulsante âmbar) */}
                      {mastery.isDecaying && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/80 animate-pulse pointer-events-none" />
                      )}

                      {/* Topo do Nó: Nível RPG + % de Domínio */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          {mastery.tier === "DIAMOND" && (
                            <Crown size={14} className="text-cyan-400 fill-cyan-400/20" />
                          )}
                          {mastery.tier === "GOLD" && (
                            <Trophy size={14} className="text-amber-400 fill-amber-400/20" />
                          )}
                          {mastery.tier === "SILVER" && (
                            <Shield size={14} className="text-slate-300 fill-slate-300/20" />
                          )}
                          {mastery.tier === "BRONZE" && (
                            <Shield size={14} className="text-orange-500 fill-orange-500/20" />
                          )}
                          {mastery.tier === "LOCKED" && (
                            <Lock size={13} className="text-slate-500" />
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${mastery.badgeColor}`}
                          >
                            {mastery.label.split("•")[0]}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-bold text-slate-300">
                          {t.performance || 0}%
                        </span>
                      </div>

                      {/* Título do Tópico */}
                      <div className="space-y-1 mb-3">
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {t.title}
                        </h4>
                        {t.relevance && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Relevância: {t.relevance}
                          </span>
                        )}
                      </div>

                      {/* Rodapé do Nó: Status e Declínio */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                        {mastery.isDecaying ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Clock size={11} />
                            Revisar Urgente
                          </span>
                        ) : t.firstStudy && t.firstStudy !== "Pendente" ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Sparkles size={11} />
                            {t.firstStudy}
                          </span>
                        ) : (
                          <span className="text-slate-500">Pendente de estudo</span>
                        )}

                        <span className="text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center">
                          Ver nó <ChevronRight size={12} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / DRAWER DE INSPEÇÃO DO NÓ SELECIONADO */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#080c16] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden"
            >
              {/* Glow do Modal */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                    {selectedTopic.subjectName || "Disciplina"}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {selectedTopic.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status de Domínio RPG */}
              {(() => {
                const m = getTopicMastery(selectedTopic);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Patente do Nó
                        </span>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                          {m.tier === "DIAMOND" && <Crown size={14} className="text-cyan-400" />}
                          {m.tier === "GOLD" && <Trophy size={14} className="text-amber-400" />}
                          {m.tier === "SILVER" && <Shield size={14} className="text-slate-300" />}
                          {m.tier === "BRONZE" && <Shield size={14} className="text-orange-500" />}
                          {m.tier === "LOCKED" && <Lock size={14} className="text-slate-500" />}
                          <span>{m.label}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Desempenho
                        </span>
                        <p className="text-sm font-mono font-black text-cyan-300">
                          {selectedTopic.performance || 0}%
                        </p>
                      </div>
                    </div>

                    {m.isDecaying && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                        <Clock size={16} className="shrink-0 text-amber-400" />
                        <span>
                          <strong>Alerta Ebbinghaus:</strong> Este conceito atingiu a data crítica de declínio na memória. Reforce agora para não esquecer!
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Ações Táticas Rápidas para o Nó */}
              <div className="space-y-2 pt-2">
                <Link
                  href="/questions"
                  onClick={() => setSelectedTopic(null)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-between cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={15} className="fill-white" />
                    <span>Fazer Questões deste Tópico</span>
                  </div>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/flashcards"
                  onClick={() => setSelectedTopic(null)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-indigo-400" />
                    <span>Revisar Flashcards Vinculados</span>
                  </div>
                  <ArrowRight size={14} />
                </Link>

                {/* Botão de Mapa Mental Neural */}
                <button
                  type="button"
                  onClick={() => {
                    const parentSubject = subjects.find(
                      (s) =>
                        s.id === selectedTopic.subjectId ||
                        s.name.toLowerCase() === selectedTopic.subjectName?.toLowerCase(),
                    );
                    setMindMapTarget({
                      topicTitle: selectedTopic.title,
                      subjectName: parentSubject?.name || selectedTopic.subjectName || "Edital",
                      topicId: selectedTopic.id,
                      color: parentSubject?.color || "#8b5cf6",
                    });
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-violet-600/25 to-indigo-600/25 hover:from-violet-600/40 hover:to-indigo-600/40 border border-violet-500/40 text-violet-200 hover:text-white text-xs font-bold transition-all shadow-md shadow-violet-950/40 flex items-center justify-between cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Brain size={15} className="text-violet-400" />
                    <span>Ver Mapa Mental do Tópico (SVG)</span>
                  </div>
                  <ArrowRight size={14} />
                </button>

                {onReviewClick && (
                  <button
                    type="button"
                    onClick={() => {
                      const topicId = selectedTopic.id;
                      setSelectedTopic(null);
                      onReviewClick(topicId);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar size={13} />
                    <span>Registrar Estudo Manual</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL INTERATIVO DE MAPA MENTAL NEURAL */}
      {mindMapTarget && (
        <MindMapModal
          isOpen={Boolean(mindMapTarget)}
          onClose={() => setMindMapTarget(null)}
          topicTitle={mindMapTarget.topicTitle}
          subjectName={mindMapTarget.subjectName}
          topicId={mindMapTarget.topicId}
          subjectColor={mindMapTarget.color}
        />
      )}
    </div>
  );
}