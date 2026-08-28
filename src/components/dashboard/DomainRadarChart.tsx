"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  AlertTriangle,
  Sparkles,
  Target,
  ShieldCheck,
  TrendingDown,
  Info,
  Layers,
} from "lucide-react";

export interface DomainRadarSubject {
  id?: string;
  name: string;
  domain?: number; // Domínio Real % (acertos em questões / flashcards)
  accuracy?: number;
  progress?: number;
  weight?: number; // Peso Ideal % no edital
  priority?: number | string;
  importance?: string;
  color?: string | null;
  _count?: {
    topics: number;
  };
}

export interface DomainRadarChartProps {
  subjects: DomainRadarSubject[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

interface ProcessedSubject {
  id: string;
  name: string;
  domain: number; // 0 to 100
  weight: number; // 0 to 100
  gap: number; // domain - weight (negative = blind spot)
  color: string;
  status: "blind_spot" | "mastered" | "balanced";
}

export default function DomainRadarChart({
  subjects = [],
  isLoading = false,
  className = "",
  title = "Radar de Domínio vs. Peso do Edital",
  subtitle = "Identificação preditiva de pontos cegos e calibração de foco",
}: DomainRadarChartProps) {
  const [hoveredSubject, setHoveredSubject] = useState<ProcessedSubject | null>(
    null,
  );
  const [filterMode, setFilterMode] = useState<"all" | "blind_spots">("all");

  // Normaliza e processa os dados de cada disciplina
  const processedData: ProcessedSubject[] = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];

    return subjects.map((sub, idx) => {
      // 1. Cálculo do Domínio Real (0 - 100%)
      let realDomain = 0;
      if (typeof sub.domain === "number") {
        realDomain = sub.domain;
      } else if (typeof sub.accuracy === "number" && sub.accuracy > 0) {
        realDomain = sub.accuracy;
      } else if (typeof sub.progress === "number") {
        realDomain = sub.progress;
      } else {
        realDomain = 0;
      }
      realDomain = Math.max(0, Math.min(100, Math.round(realDomain)));

      // 2. Cálculo do Peso Ideal no Edital (0 - 100%)
      let idealWeight = 70; // fallback padrão
      if (typeof sub.weight === "number") {
        idealWeight = sub.weight;
      } else if (typeof sub.priority === "number" && sub.priority > 0) {
        // Se a prioridade for em escala 1 a 10
        idealWeight = Math.min(100, Math.round(sub.priority * 10));
      } else if (typeof sub.priority === "string" && !isNaN(Number(sub.priority))) {
        idealWeight = Math.min(100, Math.round(Number(sub.priority) * 10));
      } else if (sub.importance) {
        const imp = sub.importance.toUpperCase();
        if (imp.includes("ALT") || imp === "HIGH" || imp === "1") idealWeight = 90;
        else if (imp.includes("MED") || imp === "MEDIUM" || imp === "2") idealWeight = 65;
        else if (imp.includes("BAIX") || imp === "LOW" || imp === "3") idealWeight = 40;
      }

      idealWeight = Math.max(10, Math.min(100, Math.round(idealWeight)));

      const gap = realDomain - idealWeight;
      let status: "blind_spot" | "mastered" | "balanced" = "balanced";
      if (gap <= -15) {
        status = "blind_spot";
      } else if (gap >= 15 || realDomain >= 85) {
        status = "mastered";
      }

      return {
        id: sub.id || `sub-${idx}`,
        name: sub.name || `Disciplina ${idx + 1}`,
        domain: realDomain,
        weight: idealWeight,
        gap,
        color: sub.color || "#818cf8",
        status,
      };
    });
  }, [subjects]);

  // Identifica o maior Ponto Cego (onde o peso é alto e o domínio é baixo)
  const blindSpots = useMemo(() => {
    return processedData
      .filter((s) => s.gap < 0)
      .sort((a, b) => a.gap - b.gap);
  }, [processedData]);

  const criticalBlindSpot = blindSpots.length > 0 ? blindSpots[0] : null;

  // Configurações do SVG Radar
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 130;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]; // 20%, 40%, 60%, 80%, 100%

  const totalAxes = processedData.length;

  // Função auxiliar para converter ângulo polar em coordenadas cartesianas
  const getCoordinates = (index: number, ratio: number) => {
    if (totalAxes === 0) return { x: cx, y: cy };
    const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
    const r = radius * Math.max(0.05, Math.min(1, ratio));
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Coordenadas dos polígonos
  const domainPolygonPoints = useMemo(() => {
    if (totalAxes < 3) return "";
    return processedData
      .map((item, i) => {
        const { x, y } = getCoordinates(i, item.domain / 100);
        return `${x},${y}`;
      })
      .join(" ");
  }, [processedData, totalAxes]);

  const weightPolygonPoints = useMemo(() => {
    if (totalAxes < 3) return "";
    return processedData
      .map((item, i) => {
        const { x, y } = getCoordinates(i, item.weight / 100);
        return `${x},${y}`;
      })
      .join(" ");
  }, [processedData, totalAxes]);

  if (isLoading) {
    return (
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] to-[#05070e] p-6 shadow-2xl ${className}`}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-white/5" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
              <div className="h-2 w-48 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        </div>
        <div className="flex h-72 items-center justify-center">
          <div className="h-44 w-44 animate-pulse rounded-full border border-indigo-500/20 bg-indigo-500/5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#090d16] via-[#070b14] to-[#04060c] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/30 ${className}`}
    >
      {/* GLOW DECORATIVO DE FUNDO */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />

      {/* ================= CABEÇALHO DO COMPONENTE ================= */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-inner shadow-indigo-500/20">
            <Radar size={20} className="animate-pulse text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                {title}
              </h3>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase text-indigo-300">
                Neural Radar
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* LEGENDA INTERATIVA */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Domínio Real %</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-[11px] font-bold text-indigo-300">
            <span className="h-2 w-2 rounded-full border border-dashed border-indigo-400 bg-indigo-500/60 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <span>Peso Ideal %</span>
          </div>
        </div>
      </div>

      {/* ================= CORPO DO GRÁFICO ================= */}
      {processedData.length === 0 ? (
        <div className="relative z-10 my-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
          <div className="mb-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-indigo-400">
            <Layers size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-200">
            Nenhuma disciplina cadastrada
          </h4>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            Adicione matérias ao seu edital verticalizado para visualizar a teia
            neural de domínio versus peso ideal.
          </p>
        </div>
      ) : processedData.length < 3 ? (
        // FALLBACK PARA 1 OU 2 DISCIPLINAS
        <div className="relative z-10 my-6 space-y-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <p className="text-xs text-amber-300">
              💡 Cadastre <strong>3 ou mais disciplinas</strong> para renderizar
              o radar poligonal completo. Abaixo está a calibragem atual:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {processedData.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {item.name}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      item.status === "blind_spot"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {item.status === "blind_spot"
                      ? "Ponto Cego"
                      : "Sob Controle"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      Domínio Real
                    </span>
                    <span className="font-mono text-slate-200">
                      {item.domain}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${item.domain}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-indigo-400 font-bold">
                      Peso Ideal
                    </span>
                    <span className="font-mono text-slate-200">
                      {item.weight}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${item.weight}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // RADAR CHART SVG COMPLETO
        <div className="relative z-10 flex flex-col items-center justify-center py-3">
          <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full overflow-visible drop-shadow-2xl select-none"
            >
              <defs>
                {/* Gradiente Domínio Real (Esmeralda / Ciano / Violeta) */}
                <linearGradient
                  id="radarEmeraldGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
                </linearGradient>

                {/* Gradiente Peso Ideal (Índigo / Violeta) */}
                <linearGradient
                  id="radarIndigoGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.10" />
                </linearGradient>

                {/* Filtro de Glow Neon */}
                <filter
                  id="radarGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. NÍVEIS CONCÊNTRICOS POLIGONAIS (TEIA DE ARANHA) */}
              {levels.map((levelRatio, lvlIdx) => {
                const ringPoints = processedData
                  .map((_, i) => {
                    const { x, y } = getCoordinates(i, levelRatio);
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <g key={`ring-${lvlIdx}`}>
                    <polygon
                      points={ringPoints}
                      fill={lvlIdx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent"}
                      stroke="rgba(148, 163, 184, 0.15)"
                      strokeWidth={lvlIdx === levels.length - 1 ? "1.5" : "0.8"}
                      strokeDasharray={lvlIdx === levels.length - 1 ? "" : "3 3"}
                    />
                    {/* Indicador numérico de percentual */}
                    <text
                      x={cx + 4}
                      y={cy - radius * levelRatio - 2}
                      fill="rgba(148, 163, 184, 0.4)"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {Math.round(levelRatio * 100)}%
                    </text>
                  </g>
                );
              })}

              {/* 2. EIXOS RADIAIS */}
              {processedData.map((_, i) => {
                const { x, y } = getCoordinates(i, 1.0);
                return (
                  <line
                    key={`axis-${i}`}
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.18)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* 3. POLÍGONO DO PESO IDEAL (ÍNDIGO/VIOLETA) */}
              {weightPolygonPoints && (
                <polygon
                  points={weightPolygonPoints}
                  fill="url(#radarIndigoGrad)"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="transition-all duration-500 opacity-80"
                />
              )}

              {/* 4. POLÍGONO DO DOMÍNIO REAL (ESMERALDA/NEON) */}
              {domainPolygonPoints && (
                <polygon
                  points={domainPolygonPoints}
                  fill="url(#radarEmeraldGrad)"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  filter="url(#radarGlow)"
                  className="transition-all duration-500 opacity-90 hover:opacity-100"
                />
              )}

              {/* 5. PONTOS INTERATIVOS DOS VÉRTICES (DOMÍNIO REAL & PESO) */}
              {processedData.map((item, i) => {
                const domCoord = getCoordinates(i, item.domain / 100);
                const wtCoord = getCoordinates(i, item.weight / 100);
                const isHovered = hoveredSubject?.id === item.id;

                return (
                  <g
                    key={`points-${item.id}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSubject(item)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    onClick={() =>
                      setHoveredSubject((prev) =>
                        prev?.id === item.id ? null : item,
                      )
                    }
                  >
                    {/* Linha vertical conectando os 2 pontos para destacar o GAP */}
                    <line
                      x1={domCoord.x}
                      y1={domCoord.y}
                      x2={wtCoord.x}
                      y2={wtCoord.y}
                      stroke={item.gap < 0 ? "#f43f5e" : "#10b981"}
                      strokeWidth={isHovered ? "2.5" : "1.5"}
                      strokeDasharray="2 2"
                      opacity={isHovered ? 1 : 0.6}
                    />

                    {/* Vértice do Peso Ideal */}
                    <circle
                      cx={wtCoord.x}
                      cy={wtCoord.y}
                      r={isHovered ? 5 : 3.5}
                      fill="#090d16"
                      stroke="#818cf8"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    {/* Vértice do Domínio Real */}
                    <circle
                      cx={domCoord.x}
                      cy={domCoord.y}
                      r={isHovered ? 7 : 4.5}
                      fill={
                        item.status === "blind_spot" ? "#f43f5e" : "#10b981"
                      }
                      stroke="#ffffff"
                      strokeWidth={isHovered ? "2.5" : "1.5"}
                      filter="url(#radarGlow)"
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* 6. RÓTULOS DAS DISCIPLINAS NO PERÍMETRO */}
              {processedData.map((item, i) => {
                const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                const labelRadius = radius + 26;
                const lx = cx + labelRadius * Math.cos(angle);
                const ly = cy + labelRadius * Math.sin(angle);

                const cosA = Math.cos(angle);
                let textAnchor: "start" | "end" | "middle" = "middle";
                if (cosA > 0.35) textAnchor = "start";
                else if (cosA < -0.35) textAnchor = "end";

                const isHovered = hoveredSubject?.id === item.id;
                const isBlindSpot = item.status === "blind_spot";

                // Truncar nome se muito longo
                const displayName =
                  item.name.length > 14
                    ? `${item.name.substring(0, 12)}...`
                    : item.name;

                return (
                  <g
                    key={`label-${item.id}`}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredSubject(item)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    onClick={() =>
                      setHoveredSubject((prev) =>
                        prev?.id === item.id ? null : item,
                      )
                    }
                  >
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      fill={
                        isHovered
                          ? "#ffffff"
                          : isBlindSpot
                            ? "#fda4af"
                            : "#cbd5e1"
                      }
                      fontSize={isHovered ? "11" : "10"}
                      fontWeight={isHovered || isBlindSpot ? "bold" : "600"}
                      className="transition-all duration-200"
                    >
                      {displayName}
                    </text>
                    <text
                      x={lx}
                      y={ly + 11}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      fill={
                        isBlindSpot
                          ? "#f43f5e"
                          : isHovered
                            ? "#10b981"
                            : "rgba(148, 163, 184, 0.7)"
                      }
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {item.domain}% / {item.weight}%
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* FLOATING TOOLTIP DE DETALHES AO PASSAR O MOUSE */}
            <AnimatePresence>
              {hoveredSubject && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="pointer-events-none absolute bottom-2 rounded-2xl border border-indigo-500/40 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl max-w-xs z-30"
                >
                  <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/10">
                    <span className="text-xs font-black text-white truncate">
                      {hoveredSubject.name}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        hoveredSubject.status === "blind_spot"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : hoveredSubject.status === "mastered"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {hoveredSubject.status === "blind_spot"
                        ? "Ponto Cego"
                        : hoveredSubject.status === "mastered"
                          ? "Dominado"
                          : "Equilibrado"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                      <span className="block text-[9px] uppercase font-bold text-emerald-400">
                        Domínio Real
                      </span>
                      <strong className="font-mono text-sm text-emerald-300">
                        {hoveredSubject.domain}%
                      </strong>
                    </div>

                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2">
                      <span className="block text-[9px] uppercase font-bold text-indigo-400">
                        Peso Ideal
                      </span>
                      <strong className="font-mono text-sm text-indigo-300">
                        {hoveredSubject.weight}%
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                    {hoveredSubject.gap < 0 ? (
                      <>
                        <TrendingDown size={13} className="text-rose-400 shrink-0" />
                        <span className="text-rose-300">
                          Déficit de{" "}
                          <strong>{Math.abs(hoveredSubject.gap)}%</strong> em
                          relação ao peso cobrado.
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">
                          Domínio superior ao peso em +
                          <strong>{hoveredSubject.gap}%</strong>.
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ================= BANNER INFORMATIVO DE PONTO CEGO / INSIGHT ================= */}
      {criticalBlindSpot && (
        <div className="relative z-10 mt-2 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 transition-all">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/20 p-2 text-rose-400 shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-200">
                Ponto Cego Crítico Detectado
              </h4>
              <span className="rounded-full border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-rose-300">
                Prioridade Máxima
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-rose-200/80 leading-relaxed">
              <strong>{criticalBlindSpot.name}</strong> possui peso elevado no
              edital (<strong>{criticalBlindSpot.weight}%</strong>), porém seu
              domínio real está em apenas{" "}
              <strong>{criticalBlindSpot.domain}%</strong> (déficit de{" "}
              {Math.abs(criticalBlindSpot.gap)}%).
            </p>
          </div>
        </div>
      )}

      {!criticalBlindSpot && processedData.length >= 3 && (
        <div className="relative z-10 mt-2 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-2 text-emerald-400 shrink-0">
            <Sparkles size={16} />
          </div>
          <p className="text-xs text-emerald-200/90">
            <strong>Excelente Alinhamento:</strong> Seu domínio real acompanha ou
            supera o peso exigido pelo edital em todas as matérias cadastradas.
          </p>
        </div>
      )}
    </div>
  );
}
