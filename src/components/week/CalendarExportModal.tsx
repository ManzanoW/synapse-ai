"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Download,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Loader2,
} from "lucide-react";
import {
  generateWeeklyScheduleIcsAction,
  CalendarExportResult,
  NextBlockDetails,
} from "@/actions/calendar-export-actions";

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarExportModal({ isOpen, onClose }: CalendarExportModalProps) {
  const [startHour, setStartHour] = useState<number>(19);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [exportData, setExportData] = useState<CalendarExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"export" | "tutorial">("export");

  // Carrega os dados de exportação e o link do Google Calendar
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    generateWeeklyScheduleIcsAction({ startHour, startMinute })
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setExportData(res);
        } else {
          setErrorMessage(res.error || "Não foi possível carregar o cronograma.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error ? err.message : "Erro ao gerar exportação.",
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, startHour, startMinute]);

  if (!isOpen) return null;

  // Realiza o download direto do arquivo .ics gerado pela Server Action
  const handleDownloadIcs = async () => {
    setIsDownloading(true);
    try {
      let content = exportData?.icsContent;
      let filename = exportData?.fileName || "Cronograma_Synapse_AI.ics";

      if (!content) {
        const res = await generateWeeklyScheduleIcsAction({
          startHour,
          startMinute,
        });
        if (!res.success || !res.icsContent) {
          throw new Error(res.error || "Falha ao gerar arquivo .ics");
        }
        content = res.icsContent;
        filename = res.fileName || filename;
        setExportData(res);
      }

      const blob = new Blob([content], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Erro ao baixar arquivo do calendário.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyGoogleLink = () => {
    if (!exportData?.nextBlockGoogleUrl) return;
    navigator.clipboard.writeText(exportData.nextBlockGoogleUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const nextBlock = exportData?.nextBlockDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header com Gradiente */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/40 via-transparent to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Sincronizar com Agenda
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Google & .ics
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exporte sua rotina semanal com recorrência automática e lembretes
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/50">
            <button
              onClick={() => setActiveTab("export")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "export"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Exportação Rápida
            </button>
            <button
              onClick={() => setActiveTab("tutorial")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "tutorial"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <HelpCircle size={13} />
              <span>Como Importar</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === "export" ? (
            <>
              {/* Horário Padrão de Início dos Estudos */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-400" />
                    Horário de Início Padrão
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Os blocos de matérias começarão a partir deste horário
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opção 1: Download Completo .ics */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        1. Arquivo Completo da Grade (.ics)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sincroniza todos os dias ativos da semana de uma só vez
                      com repetição semanal contínua (
                      <code className="text-indigo-300 font-mono text-[11px]">
                        RRULE:FREQ=WEEKLY
                      </code>
                      ) e lembretes 15 min antes.
                    </p>
                    {exportData?.totalEventsScheduled ? (
                      <p className="text-[11px] text-emerald-400 font-medium">
                        ✓ {exportData.totalEventsScheduled} blocos de disciplinas
                        mapeados e prontos.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] text-slate-400">
                    Compatível com: Google Calendar, Apple Calendar (iPhone/Mac)
                    e Outlook
                  </span>

                  <button
                    onClick={handleDownloadIcs}
                    disabled={isDownloading || isLoading}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Gerando .ics...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Baixar Cronograma (.ics)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Opção 2: Google Calendar Direto para o Próximo Bloco */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800 relative overflow-hidden">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      2. Próximo Bloco de Estudo (Google Calendar 1-Clique)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Adicione diretamente à sua conta Google o próximo bloco de
                    estudos agendado com título e tópicos preenchidos.
                  </p>
                </div>

                {nextBlock ? (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <BookOpen size={13} className="text-cyan-400" />
                        {nextBlock.subjectName}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                        {nextBlock.dayName} às {nextBlock.startTime} • {nextBlock.durationMinutes} min
                      </span>
                    </div>

                    {nextBlock.topics.length > 0 && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        <strong className="text-slate-300">Tópicos:</strong>{" "}
                        {nextBlock.topics.join(" • ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400 italic">
                    Nenhum bloco futuro pendente encontrado na grade.
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2 flex-wrap">
                  {exportData?.nextBlockGoogleUrl && (
                    <>
                      <button
                        onClick={handleCopyGoogleLink}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        title="Copiar link do Google Calendar"
                      >
                        {copiedLink ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={exportData.nextBlockGoogleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        <span>Abrir no Google Calendar</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Tutorial de Importação */
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  Google Calendar (Web / Android)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed pl-1">
                  <li>Clique em <strong>Baixar Cronograma (.ics)</strong> na aba anterior.</li>
                  <li>Acesse o <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Calendar</a> no computador.</li>
                  <li>No canto superior direito, clique na <strong>Engrenagem (Configurações)</strong>.</li>
                  <li>No menu esquerdo, selecione <strong>Importar e Exportar</strong>.</li>
                  <li>Clique em <em>Selecionar arquivo do computador</em>, escolha o arquivo <code className="text-indigo-300">Cronograma_Synapse_AI.ics</code> e confirme em <strong>Importar</strong>.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  Apple Calendar (iPhone, iPad & Mac)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed pl-1">
                  <li>No Mac ou iPhone, baixe o arquivo <code className="text-cyan-300">.ics</code>.</li>
                  <li>Dê um toque no arquivo baixado: o iOS / macOS abrirá o aplicativo <strong>Calendário</strong>.</li>
                  <li>Clique em <strong>Adicionar Todos</strong> para sincronizar instantaneamente com lembretes automáticos.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  Microsoft Outlook
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed pl-1">
                  <li>No Outlook Web ou Desktop, vá para o módulo de <strong>Calendário</strong>.</li>
                  <li>Clique em <strong>Adicionar Calendário</strong> &gt; <strong>Fazer upload do arquivo</strong>.</li>
                  <li>Selecione o arquivo <code className="text-emerald-300">Cronograma_Synapse_AI.ics</code> para importar todos os blocos.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles size={12} className="text-indigo-400" />
            Recorrência semanal RFC 5545 sincronizada.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
