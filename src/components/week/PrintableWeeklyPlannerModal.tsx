"use client";

import React, { useMemo } from "react";
import {
  X,
  Printer,
  Calendar,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  CheckSquare,
  FileText,
} from "lucide-react";

export interface ScheduledTopic {
  id: string;
  title: string;
  firstStudy?: string;
  relevance?: string;
  performance?: number;
}

export interface ScheduledSubjectItem {
  id: string;
  name: string;
  priority: number;
  color?: string | null;
  dailyMinutesAllocated: number;
  assignedTopics: ScheduledTopic[];
}

export interface DayScheduleItem {
  dayIndex: number;
  dayName: string;
  totalMinutes: number;
  subjects: ScheduledSubjectItem[];
}

export interface SubjectOverviewItem {
  id: string;
  name: string;
  color?: string | null;
  weeklyMinutesAllocated: number;
  percentageOfTotal: number;
}

interface PrintableWeeklyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleByDay: DayScheduleItem[];
  subjectOverview: SubjectOverviewItem[];
  weeklyGoalHours?: number;
  activeDaysPerWeek?: number;
  userName?: string | null;
}

const ORDERED_DAYS = [
  { index: 1, name: "Segunda-feira", short: "SEG" },
  { index: 2, name: "Terça-feira", short: "TER" },
  { index: 3, name: "Quarta-feira", short: "QUA" },
  { index: 4, name: "Quinta-feira", short: "QUI" },
  { index: 5, name: "Sexta-feira", short: "SEX" },
  { index: 6, name: "Sábado", short: "SÁB" },
  { index: 0, name: "Domingo", short: "DOM" },
];

export function PrintableWeeklyPlannerModal({
  isOpen,
  onClose,
  scheduleByDay,
  subjectOverview,
  weeklyGoalHours = 10,
  activeDaysPerWeek = 5,
  userName = "Concurseiro",
}: PrintableWeeklyPlannerModalProps) {
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is sunday, 1 is monday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDay = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    return `${formatDay(monday)} a ${formatDay(sunday)}`;
  }, []);

  const totalAllocatedMinutes = useMemo(() => {
    return subjectOverview.reduce(
      (acc, s) => acc + (s.weeklyMinutesAllocated || 0),
      0,
    );
  }, [subjectOverview]);

  const totalAllocatedHours = (totalAllocatedMinutes / 60).toFixed(1);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ESTILOS DE IMPRESSÃO ISOLADOS (@media print) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          body * {
            visibility: hidden !important;
          }
          #synapse-printable-planner,
          #synapse-printable-planner * {
            visibility: visible !important;
          }
          #synapse-printable-planner {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* MODAL PREVIEW EM TELA */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-print">
        <div className="relative w-full max-w-6xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
          {/* HEADER DO MODAL (Não impresso) */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <Calendar size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Planner Semanal de Mesa</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                    Folha A4
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Semana {currentWeekDays} • {totalAllocatedHours}h programadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Printer size={15} />
                <span>Imprimir Planner (A4)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                title="Fechar visualização"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* DICA DE IMPRESSÃO */}
          <div className="px-5 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-500/20 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2">
            <span>
              💡 <b>Dica de Impressão:</b> Selecione orientação <b>Paisagem (Landscape)</b> e marque <b>"Gráficos de segundo plano"</b> para imprimir em alta definição com caixas de marcação à caneta.
            </span>
          </div>

          {/* VISUALIZADOR COM SCROLL PARA TELA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-black/40">
            {/* CONTAINER QUE SERÁ IMPRESSO */}
            <div
              id="synapse-printable-planner"
              className="bg-white text-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 w-full max-w-[1100px] mx-auto text-xs font-sans print:border-none print:shadow-none print:p-0"
            >
              {/* CABEÇALHO DO PLANNER */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                    S
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                      Planner Semanal de Estudos • Deep Work
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Aluno: <span className="font-bold text-slate-800">{userName}</span> • Semana: <span className="font-bold text-slate-800">{currentWeekDays}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="border-r border-slate-200 pr-3">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                      Meta Semanal
                    </span>
                    <span className="text-sm font-black text-indigo-700">
                      {weeklyGoalHours}h <span className="text-[10px] text-slate-500 font-medium">({totalAllocatedHours}h alocadas)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                      Dias Ativos
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {activeDaysPerWeek} dias
                    </span>
                  </div>
                </div>
              </div>

              {/* GRADE DE 7 COLUNAS (SEGUNDA A DOMINGO) */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {ORDERED_DAYS.map((dayInfo) => {
                  const dayData = scheduleByDay.find(
                    (d) => d.dayIndex === dayInfo.index,
                  );
                  const subjects = dayData?.subjects || [];
                  const totalDayMinutes = dayData?.totalMinutes || 0;
                  const totalDayHours = (totalDayMinutes / 60).toFixed(1);

                  return (
                    <div
                      key={dayInfo.index}
                      className="flex flex-col border border-slate-300 rounded-lg overflow-hidden min-h-[380px] bg-slate-50/30"
                    >
                      {/* TOPO DO DIA */}
                      <div className="bg-slate-900 text-white p-2 text-center">
                        <span className="font-black text-[11px] uppercase tracking-wider block">
                          {dayInfo.short}
                        </span>
                        <span className="text-[9px] text-slate-300 font-mono">
                          {totalDayMinutes > 0 ? `${totalDayHours}h (${totalDayMinutes}m)` : "Livre"}
                        </span>
                      </div>

                      {/* CONTEÚDO DO DIA */}
                      <div className="p-1.5 flex-1 flex flex-col gap-1.5">
                        {subjects.length > 0 ? (
                          subjects.map((sub, sIdx) => {
                            const subColor = sub.color || "#4f46e5";
                            return (
                              <div
                                key={`${dayInfo.index}-sub-${sIdx}`}
                                className="p-1.5 rounded-md border border-slate-200 bg-white shadow-2xs flex flex-col justify-between"
                                style={{ borderLeft: `3px solid ${subColor}` }}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <span className="font-bold text-[10px] text-slate-900 leading-tight truncate">
                                      {sub.name}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500 font-bold shrink-0">
                                      {sub.dailyMinutesAllocated}m
                                    </span>
                                  </div>

                                  {/* TÓPICOS ATRIBUÍDOS */}
                                  {sub.assignedTopics && sub.assignedTopics.length > 0 ? (
                                    <div className="space-y-1 my-1">
                                      {sub.assignedTopics.slice(0, 3).map((top) => (
                                        <div
                                          key={top.id}
                                          className="text-[9px] text-slate-600 flex items-start gap-1 leading-tight"
                                        >
                                          <span className="text-slate-400">•</span>
                                          <span className="truncate">{top.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>

                                {/* CHECKBOXES DE CICLO / RESOLUÇÃO */}
                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                                  <label className="flex items-center gap-1 cursor-default">
                                    <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block" />
                                    <span>Teoria</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-default">
                                    <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block" />
                                    <span>Questões</span>
                                  </label>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-2 text-center text-slate-400">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Descanso / Revisão
                            </span>
                            <span className="text-[8px] text-slate-400 mt-1">
                              Dia livre programado
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RODAPÉ DO PLANNER: DISTRIBUIÇÃO & METAS & ANOTAÇÕES */}
              <div className="grid grid-cols-3 gap-3 border-t-2 border-slate-900 pt-3 text-[10px]">
                {/* 1. DISTRIBUIÇÃO POR MATÉRIA */}
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 uppercase text-[9px] mb-1.5 flex items-center gap-1">
                    <Target size={11} className="text-indigo-600" />
                    Distribuição da Semana
                  </h3>
                  <div className="space-y-1">
                    {subjectOverview.slice(0, 5).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between text-[9px]"
                      >
                        <span className="text-slate-700 font-medium truncate max-w-[130px]">
                          {sub.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {Math.round(sub.weeklyMinutesAllocated / 60)}h ({sub.percentageOfTotal}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. CHECKLIST DE METAS DE ALTA PERFORMANCE */}
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 uppercase text-[9px] mb-1.5 flex items-center gap-1">
                    <CheckSquare size={11} className="text-emerald-600" />
                    Compromissos Inegociáveis
                  </h3>
                  <div className="space-y-1 text-[9px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block shrink-0" />
                      <span>Cumprir 100% das horas planejadas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block shrink-0" />
                      <span>Resolver mínimo 50 questões na semana</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block shrink-0" />
                      <span>Alimentar o Caderno de Erros no mesmo dia</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block shrink-0" />
                      <span>Zerar revisões atrasadas no SM-2</span>
                    </div>
                  </div>
                </div>

                {/* 3. QUADRO DE ANOTAÇÕES & BIZÚS */}
                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 uppercase text-[9px] mb-1.5 flex items-center gap-1">
                    <FileText size={11} className="text-amber-600" />
                    Anotações & Bizús da Semana
                  </h3>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="border-b border-dashed border-slate-300 h-3" />
                    <div className="border-b border-dashed border-slate-300 h-3" />
                    <div className="border-b border-dashed border-slate-300 h-3" />
                    <div className="border-b border-dashed border-slate-300 h-3" />
                  </div>
                </div>
              </div>

              {/* ASSINATURA DE COMPROMISSO */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                <span>SYNAPSE AI • MÉTODO COGNITIVO DE ALTO RENDIMENTO</span>
                <span>"A aprovação é construída um bloco por vez."</span>
                <span>Assinatura do Aluno: ___________________________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
