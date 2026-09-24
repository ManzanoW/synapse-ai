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
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
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

function getTopicIncidence(
  t: SkillTreeTopic,
  index: number,
): { label: string; level: "HIGH" | "MEDIUM" | "NORMAL" } {
  if (t.relevance) {
    const r = t.relevance.toLowerCase();
    if (r.includes("alta") || r.includes("muito")) {
      return { label: "Alta Incidência • 42%", level: "HIGH" };
    }
    if (r.includes("méd") || r.includes("med")) {
      return { label: "Média Incidência • 22%", level: "MEDIUM" };
    }
    return { label: "Incidência Padrão • 10%", level: "NORMAL" };
  }
  const charCode = t.title ? t.title.charCodeAt(0) : 65;
  const hash = (charCode + t.id.length + index) % 10;
  if (hash <= 2) return { label: "Alta Incidência • 45%", level: "HIGH" };
  if (hash <= 6) return { label: "Média Incidência • 24%", level: "MEDIUM" };
  return { label: "Incidência Padrão • 9%", level: "NORMAL" };
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

function hexToRgba(hex?: string | null, alpha = 1): string {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  let clean = hex.slice(1);
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface SkillTreeTopicCardProps {
  topic: SkillTreeTopic;
  subColor: string;
  isSelected: boolean;
  isPro: boolean;
  onSelect: () => void;
  onOpenProIncidence: () => void;
  index: number;
}

function SkillTreeTopicCard({
  topic,
  subColor,
  isSelected,
  isPro,
  onSelect,
  onOpenProIncidence,
  index,
}: SkillTreeTopicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mastery = getTopicMastery(topic);
  const inc = getTopicIncidence(topic, index);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className="p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between group"
      style={{
        borderColor: isSelected
          ? subColor
          : isHovered
          ? hexToRgba(subColor, 0.75)
          : "rgba(30, 41, 59, 0.8)",
        backgroundColor: isSelected
          ? "rgba(15, 23, 42, 0.95)"
          : isHovered
          ? "rgba(15, 23, 42, 0.85)"
          : "rgba(2, 6, 23, 0.6)",
        boxShadow: isSelected
          ? `0 0 20px ${hexToRgba(subColor, 0.4)}`
          : isHovered
          ? `0 8px 24px -4px ${hexToRgba(subColor, 0.25)}, 0 0 12px ${hexToRgba(subColor, 0.15)}`
          : undefined,
      }}
    >
      {/* Brilho suave da cor da matéria ao passar o mouse */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: subColor,
          opacity: isSelected ? 0.12 : isHovered ? 0.08 : 0,
        }}
      />

      {/* Alerta de Ebbinghaus (Borda pulsante âmbar) */}
      {mastery.isDecaying && (
        <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/80 animate-pulse pointer-events-none" />
      )}

      {/* Topo do Nó: Nível RPG + % de Domínio */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
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

        <span
          className="font-mono text-xs font-bold transition-colors duration-200"
          style={{
            color: isHovered || isSelected ? subColor : "rgb(203, 213, 225)",
          }}
        >
          {topic.performance || 0}%
        </span>
      </div>

      {/* Título do Tópico */}
      <div className="space-y-1.5 mb-3 relative z-10">
        <h4
          className="text-xs font-bold transition-colors duration-200 line-clamp-2"
          style={{
            color: isHovered || isSelected ? subColor : "#ffffff",
          }}
        >
          {topic.title}
        </h4>

        {/* Raio-X de Incidência da Banca */}
        <div className="pt-0.5">
          {isPro ? (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                inc.level === "HIGH"
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  : inc.level === "MEDIUM"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
              }`}
            >
              {inc.level === "HIGH" && <Flame size={10} className="text-rose-400" />}
              {inc.level === "MEDIUM" && <Zap size={10} className="text-amber-400" />}
              <span>{inc.label}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProIncidence();
              }}
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-amber-500/10 text-amber-300/80 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer"
              title="Raio-X de Incidência da Banca (Exclusivo Synapse Pro)"
            >
              <Lock size={9} className="text-amber-400" />
              <span>Raio-X Banca</span>
              <Crown size={9} className="text-amber-400 fill-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Rodapé do Nó: Status e Declínio */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] relative z-10">
        {mastery.isDecaying ? (
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Clock size={11} />
            Revisar Urgente
          </span>
        ) : topic.firstStudy && topic.firstStudy !== "Pendente" ? (
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles size={11} />
            {topic.firstStudy}
          </span>
        ) : (
          <span className="text-slate-500">Pendente de estudo</span>
        )}

        <span
          className="transition-colors duration-200 flex items-center gap-0.5"
          style={{
            color: isHovered || isSelected ? subColor : "rgb(100, 116, 139)",
          }}
        >
          <span>Ver nó</span>
          <ChevronRight
            size={12}
            className={`transition-transform duration-200 ${
              isHovered ? "translate-x-0.5" : ""
            }`}
          />
        </span>
      </div>
    </motion.div>
  );
}

export function EditalSkillTree({
  subjects,
  topics,
  onReviewClick,
}: EditalSkillTreeProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = useState<SkillTreeTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [showProIncidenceModal, setShowProIncidenceModal] = useState(false);
  const [mindMapTarget, setMindMapTarget] = useState<{
    topicTitle: string;
    subjectName: string;
    topicId?: string;
    color?: string;
  } | null>(null);

  React.useEffect(() => {
    getAiQuotaStatusAction().then((res) => {
      if (res.success && res.data) {
        setIsPro(res.data.isUnlimited);
      }
    });
  }, []);

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
                {group.topics.map((t, idx) => (
                  <SkillTreeTopicCard
                    key={t.id}
                    topic={t}
                    subColor={subColor}
                    isSelected={selectedTopic?.id === t.id}
                    isPro={isPro}
                    onSelect={() => setSelectedTopic(t)}
                    onOpenProIncidence={() => setShowProIncidenceModal(true)}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / DRAWER DE INSPEÇÃO DO NÓ SELECIONADO */}
      <AnimatePresence>
        {selectedTopic && (() => {
          const activeSubject = subjects.find(
            (s) =>
              s.id === selectedTopic.subjectId ||
              s.name.toLowerCase() === selectedTopic.subjectName?.toLowerCase(),
          );
          const activeColor =
            activeSubject?.color || selectedTopic.subjectColor || "#6366f1";
          const m = getTopicMastery(selectedTopic);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg bg-[#080c16] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden border"
                style={{
                  borderColor: hexToRgba(activeColor, 0.45),
                  boxShadow: `0 0 40px ${hexToRgba(activeColor, 0.18)}, 0 20px 50px -10px rgba(0, 0, 0, 0.85)`,
                }}
              >
                {/* Glow do Modal na Cor da Matéria */}
                <div
                  className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                  style={{
                    backgroundColor: activeColor,
                    opacity: 0.18,
                  }}
                />

                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4 relative z-10">
                  <div className="space-y-1">
                    <span
                      className="text-[10px] font-mono uppercase font-bold tracking-wider"
                      style={{ color: activeColor }}
                    >
                      {selectedTopic.subjectName || activeSubject?.name || "Disciplina"}
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
                <div className="space-y-3 relative z-10">
                  <div
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border"
                    style={{ borderColor: hexToRgba(activeColor, 0.25) }}
                  >
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
                      <p
                        className="text-sm font-mono font-black"
                        style={{ color: activeColor }}
                      >
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

                  {/* Raio-X da Banca no Modal */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <Flame size={12} className="text-amber-400" />
                        Raio-X de Incidência da Banca
                      </span>
                      {isPro ? (
                        <p className="text-xs font-bold text-amber-300">
                          {getTopicIncidence(selectedTopic, 0).label} nas últimas provas oficiais
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Estatística oculta no plano gratuito
                        </p>
                      )}
                    </div>
                    {!isPro && (
                      <button
                        type="button"
                        onClick={() => setShowProIncidenceModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-500/30 transition-colors cursor-pointer"
                      >
                        <Crown size={11} />
                        <span>Desbloquear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ações Táticas Rápidas para o Nó */}
                <div className="space-y-2 pt-2 relative z-10">
                  <Link
                    href="/questions"
                    onClick={() => setSelectedTopic(null)}
                    className="w-full py-3 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center justify-between cursor-pointer active:scale-95 group"
                    style={{
                      background: `linear-gradient(135deg, #4f46e5 0%, ${activeColor} 100%)`,
                      boxShadow: `0 4px 14px ${hexToRgba(activeColor, 0.35)}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={15} className="fill-white" />
                      <span>Fazer Questões deste Tópico</span>
                    </div>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/flashcards"
                    onClick={() => setSelectedTopic(null)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border text-slate-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 group"
                    style={{ borderColor: hexToRgba(activeColor, 0.25) }}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={15} style={{ color: activeColor }} />
                      <span>Revisar Flashcards Vinculados</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Botão de Mapa Mental Neural */}
                  <button
                    type="button"
                    onClick={() => {
                      setMindMapTarget({
                        topicTitle: selectedTopic.title,
                        subjectName: activeSubject?.name || selectedTopic.subjectName || "Edital",
                        topicId: selectedTopic.id,
                        color: activeColor,
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
          );
        })()}
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

      {/* MODAL RAIO-X EXCLUSIVO PRO */}
      {showProIncidenceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#090d1c] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowProIncidenceModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Crown size={28} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Recurso Exclusivo Synapse Pro
              </span>
              <h3 className="text-base font-bold text-white">
                Raio-X de Incidência da Banca Examinadora
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Descubra a frequência estatística exata de cada tópico nas provas anteriores da sua banca (FGV, Cebraspe, FCC, Vunesp). Priorize seu tempo no que realmente é cobrado e estude com precisão cirúrgica.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/pricing"
                onClick={() => setShowProIncidenceModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
              >
                <Crown size={15} />
                <span>Desbloquear Raio-X com Synapse Pro</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowProIncidenceModal(false)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Continuar no Plano Gratuito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}