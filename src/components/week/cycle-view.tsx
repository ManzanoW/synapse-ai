"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  Sparkles,
  BookOpen,
  X,
  FileText,
  Flame,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { formatMinutes, CycleBlock } from "@/lib/study-cycle";

interface CycleViewProps {
  blocks: CycleBlock[];
  totalBlocks: number;
  completedBlocks: number;
  currentProgress: number;
  totalMinutes: number;
  cycleLap: number;
  subjectBreakdown: {
    id: string;
    name: string;
    color: string;
    allocatedMinutes: number;
    percentage: number;
  }[];
  onCompleteBlock: () => void;
  onUndoBlock: () => void;
}

export function CycleView({
  blocks,
  totalBlocks,
  completedBlocks,
  currentProgress,
  totalMinutes,
  cycleLap,
  subjectBreakdown,
  onCompleteBlock,
  onUndoBlock,
}: CycleViewProps) {
  const [expandedBlockNumber, setExpandedBlockNumber] = useState<number | null>(
    null,
  );
  const [activeSessionBlock, setActiveSessionBlock] =
    useState<CycleBlock | null>(null);

  // Estados do Player Imersivo
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const remainingMinutes = Math.max(
    0,
    totalMinutes * (1 - currentProgress / 100),
  );

  // Identifica o bloco atual ("CURRENT")
  const currentBlock = blocks.find((b) => b.status === "CURRENT") || blocks[0];

  // Filtra blocos futuros (excluindo o atual para não duplicar no Hero)
  const upcomingBlocks = blocks.filter(
    (b) => b.blockNumber !== currentBlock?.blockNumber,
  );

  const handleStartSession = (block: CycleBlock) => {
    setActiveSessionBlock(block);
    setSecondsRemaining(block.durationMinutes * 60);
    setIsTimerRunning(true);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleExpand = (blockNum: number) => {
    setExpandedBlockNumber((prev) => (prev === blockNum ? null : blockNum));
  };

  const handleFinishSession = () => {
    setIsTimerRunning(false);
    setActiveSessionBlock(null);
    onCompleteBlock();
  };

  // SVG Donut Multi-Colorido para o Painel Cyberpunk de Distribuição
  const donutSegments = (() => {
    let accumulated = 0;
    return subjectBreakdown.map((sub) => {
      const strokeDasharray = `${sub.percentage} ${100 - sub.percentage}`;
      const strokeDashoffset = -accumulated;
      accumulated += sub.percentage;
      return {
        ...sub,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. PAINEL DE TELEMETRIA SUPERIOR (DASHBOARD COCKPIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD DE PROGRESSO DA VOLTA */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <Flame size={11} className="text-indigo-400 animate-pulse" />
                  Volta #{cycleLap}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Ciclo Ativo
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Compass className="text-indigo-400" size={22} />
                Navegação do Ciclo
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {completedBlocks > 0 && (
                <button
                  onClick={onUndoBlock}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-xl transition-all active:scale-95"
                  title="Desfazer bloco anterior"
                >
                  <RotateCcw size={13} />
                  <span>Desfazer</span>
                </button>
              )}
              <div className="bg-indigo-950/60 border border-indigo-800/50 px-4 py-2 rounded-2xl text-right">
                <span className="text-xl font-black text-indigo-400 font-mono block leading-none">
                  {completedBlocks}/{totalBlocks}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                  Blocos ({currentProgress}%)
                </span>
              </div>
            </div>
          </div>

          <div className="my-6 space-y-2 relative z-10">
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
              <span>Progresso na Volta Atual</span>
              <span>
                Faltam{" "}
                <strong className="text-indigo-300 font-mono font-semibold">
                  {formatMinutes(remainingMinutes)}
                </strong>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/60 text-center relative z-10">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Carga Total
              </span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {formatMinutes(totalMinutes)}
              </span>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Concluídos
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {completedBlocks} blocos
              </span>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Restantes
              </span>
              <span className="text-xs font-bold text-indigo-400 font-mono">
                {totalBlocks - completedBlocks} blocos
              </span>
            </div>
          </div>
        </div>

        {/* DONUT TELEMETRY - DISTRIBUIÇÃO DAS MATÉRIAS */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              Balanço por Matéria
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {subjectBreakdown.length} matérias
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-slate-950"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.id}
                    className="transition-all duration-700 ease-out"
                    stroke={seg.color}
                    strokeWidth="4"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    cx="18"
                    cy="18"
                    r="15.9155"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Zap size={16} className="text-indigo-400 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 max-h-36 overflow-y-auto pr-1">
              {subjectBreakdown.map((sub) => (
                <div
                  key={sub.id}
                  className="flex justify-between items-center text-[11px]"
                >
                  <span className="flex items-center gap-1.5 truncate pr-2 text-slate-300">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: sub.color,
                        boxShadow: `0 0 6px ${sub.color}`,
                      }}
                    />
                    <span className="truncate font-medium">{sub.name}</span>
                  </span>
                  <span className="font-mono text-slate-400 font-bold shrink-0">
                    {sub.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO CARD: CENTRAL DE EXECUÇÃO DO BLOCO ATUAL ("VOCÊ ESTÁ AQUI") */}
      {currentBlock && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black tracking-widest text-indigo-400 uppercase flex items-center gap-2">
              <Target size={15} className="text-indigo-400 animate-spin" />
              Próxima Execução (Alvo Primário)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Bloco #{currentBlock.blockNumber}
            </span>
          </div>

          <div
            className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(99,102,241,0.25)] relative overflow-hidden transition-all group"
            style={{
              borderColor: currentBlock.color,
              boxShadow: `0 0 30px ${currentBlock.color}25`,
            }}
          >
            {/* Glow Dinâmico de Fundo */}
            <div
              className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: currentBlock.color }}
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-4 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5"
                    style={{
                      backgroundColor: currentBlock.color,
                      boxShadow: `0 0 12px ${currentBlock.color}60`,
                    }}
                  >
                    <Flame size={12} className="fill-white" />
                    EM FOCO AGORA
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock size={12} className="text-slate-500" />
                    {formatMinutes(currentBlock.durationMinutes)}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentBlock.subjectName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Conclua os tópicos previstos abaixo para manter a aceleração
                    do ciclo.
                  </p>
                </div>

                {/* Tópicos Previstos em Chips */}
                {currentBlock.assignedTopics.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <BookOpen size={12} className="text-indigo-400" />
                      Conteúdos Mapeados:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentBlock.assignedTopics.map((top) => (
                        <span
                          key={top.id}
                          className="text-xs bg-slate-950/80 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl font-medium flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {top.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Ação Primário (Play para o Player de Estudo) */}
              <div className="shrink-0 flex flex-col items-stretch lg:items-end justify-center pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                <button
                  onClick={() => handleStartSession(currentBlock)}
                  className="group/btn relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-95"
                >
                  <Play
                    size={18}
                    className="fill-white transition-transform group-hover/btn:scale-110"
                  />
                  <span>ENTRAR NA ARENA DE ESTUDO</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover/btn:translate-x-1"
                  />
                </button>
                <span className="text-[10px] font-mono text-slate-500 text-center lg:text-right mt-2">
                  Abre o cronômetro + lousa de anotações
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILA DE EXECUÇÃO MODULAR (GRID DE BLOCOS SECUNDÁRIOS) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
            <ShieldCheck size={15} className="text-slate-500" />
            Fila de Sequência do Ciclo
          </h3>
          <span className="text-[11px] text-slate-500 italic">
            Reinicia automaticamente na conclusão de todos os nós
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingBlocks.map((block) => {
            const isDone = block.status === "COMPLETED";
            const isExpanded = expandedBlockNumber === block.blockNumber;

            return (
              <div
                key={block.blockNumber}
                className={`border rounded-2xl p-4 space-y-3 transition-all duration-300 relative overflow-hidden ${
                  isDone
                    ? "bg-slate-950/30 border-slate-800/40 opacity-50"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                {/* Tag Lateral Neon */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{
                    backgroundColor: block.color,
                    boxShadow: isDone ? "none" : `0 0 8px ${block.color}`,
                  }}
                />

                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{block.blockNumber}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[160px]">
                      {block.subjectName}
                    </span>
                  </div>

                  {isDone ? (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">
                      ✓ Feito
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full">
                      Fila
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-slate-400 pl-1 pt-1 border-t border-slate-800/40">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock size={11} className="text-slate-500" />
                    {formatMinutes(block.durationMinutes)}
                  </span>

                  {block.assignedTopics.length > 0 && (
                    <button
                      onClick={() => toggleExpand(block.blockNumber)}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-sans"
                    >
                      <span>{block.assignedTopics.length} tópicos</span>
                      {isExpanded ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>
                  )}
                </div>

                {/* Accordion de Tópicos */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800/60 space-y-1 animate-in fade-in duration-150">
                    {block.assignedTopics.map((top) => (
                      <div
                        key={top.id}
                        className="text-[11px] text-slate-400 bg-slate-950/80 p-1.5 rounded-lg border border-slate-900 truncate"
                      >
                        • {top.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PLAYER DE ESTUDO IMERSIVO (MODAL ARENA) */}
      {activeSessionBlock && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#090d16] border border-indigo-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 tracking-widest bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-md">
                  Sessão Ativa
                </span>
                <h3 className="text-xl font-black text-white mt-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: activeSessionBlock.color,
                    }}
                  />
                  {activeSessionBlock.subjectName}
                </h3>
              </div>

              <button
                onClick={() => setActiveSessionBlock(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Display do Cronômetro */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2">
              <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-wider drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Meta do Bloco: {activeSessionBlock.durationMinutes} min
              </span>
            </div>

            {/* Tópicos a Cobrir */}
            {activeSessionBlock.assignedTopics.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-400" /> Tópicos a
                  Cobrir:
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {activeSessionBlock.assignedTopics.map((top) => (
                    <div
                      key={top.id}
                      className="text-xs bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl text-slate-200 flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>{top.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloco de Anotações Rápidas */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-400" /> Anotações
                Rápidas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anote dúvidas, fórmulas ou gatilhos mentais da sessão..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>

            {/* Rodapé e Conclusão */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveSessionBlock(null)}
                className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Pausar e Sair
              </button>
              <button
                type="button"
                onClick={handleFinishSession}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>Concluir Bloco de Estudo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
