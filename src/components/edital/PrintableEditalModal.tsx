"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  Sparkles,
  Download,
} from "lucide-react";

interface TopicItem {
  id: string;
  title: string;
  subjectName?: string;
  firstStudy?: string;
  performance?: number;
  weight?: number | string;
}

interface SubjectItem {
  id: string;
  name: string;
  color?: string | null;
  weight?: number;
}

interface PrintableEditalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  topics: TopicItem[];
  careerName?: string;
}

export function PrintableEditalModal({
  isOpen,
  onClose,
  subjects,
  topics,
  careerName = "Concurso Público",
}: PrintableEditalModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [includeCompleted, setIncludeCompleted] = useState<boolean>(true);

  // Agrupa tópicos por matéria
  const groupedData = useMemo(() => {
    const map = new Map<string, { subject: SubjectItem; topics: TopicItem[] }>();

    // Inicializa matérias
    subjects.forEach((s) => {
      map.set(s.name.toLowerCase().trim(), { subject: s, topics: [] });
    });

    // Associa tópicos
    topics.forEach((t) => {
      const sName = (t.subjectName || "Geral").toLowerCase().trim();
      let entry = map.get(sName);
      if (!entry) {
        entry = {
          subject: { id: sName, name: t.subjectName || "Geral" },
          topics: [],
        };
        map.set(sName, entry);
      }
      entry.topics.push(t);
    });

    return Array.from(map.values()).filter((group) => {
      if (selectedSubjectId !== "ALL") {
        return group.subject.id === selectedSubjectId || group.subject.name === selectedSubjectId;
      }
      return group.topics.length > 0;
    });
  }, [subjects, topics, selectedSubjectId]);

  // Estatísticas globais
  const stats = useMemo(() => {
    const total = topics.length;
    const studied = topics.filter(
      (t) => t.firstStudy && t.firstStudy !== "Pendente"
    ).length;
    const progress = total > 0 ? Math.round((studied / total) * 100) : 0;
    return { total, studied, progress };
  }, [topics]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* CSS ISOLADO PARA IMPRESSÃO EM FOLHA A4 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #synapse-printable-edital,
          #synapse-printable-edital * {
            visibility: visible;
          }
          #synapse-printable-edital {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 15px !important;
            display: block !important;
          }
          .no-print-edital {
            display: none !important;
          }
          .edital-page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO EM TELA */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-print-edital">
        <div className="relative w-full max-w-5xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* HEADER */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Edital Verticalizado Imprimível</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold">
                    Checklist de Mesa
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Folha oficial para impressão ou PDF com checkboxes de Teoria, Revisões (24h/7d/30d) e Questões.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* BARRA DE CONTROLE */}
          <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <option value="ALL">Todas as Matérias ({topics.length} tópicos)</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <span className="text-slate-500 dark:text-slate-400 text-xs">
                Cobertura do Edital: <strong className="text-cyan-600 dark:text-cyan-400">{stats.progress}%</strong> ({stats.studied}/{stats.total})
              </span>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-md shadow-cyan-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>

          {/* PREVIEW DA FOLHA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-[#070a13]">
            <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 font-sans space-y-6">
              {/* Cabeçalho da Folha */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black tracking-widest text-cyan-700 uppercase">
                    SYNAPSE AI • EDITAL VERTICALIZADO
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Checklist Oficial de Matérias: {careerName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Data: <strong>{new Date().toLocaleDateString("pt-BR")}</strong> • Total de Tópicos:{" "}
                    <strong>{topics.length}</strong> • Estudados no App: <strong>{stats.studied} ({stats.progress}%)</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-md bg-slate-100 font-bold border border-slate-300 text-xs">
                    Progresso Geral: {stats.progress}%
                  </span>
                </div>
              </div>

              {/* Tabela de Disciplinas */}
              {groupedData.map((group, gIdx) => (
                <div key={group.subject.id || gIdx} className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold">
                    <span>{group.subject.name.toUpperCase()}</span>
                    <span className="text-[11px] font-mono text-cyan-300">
                      {group.topics.length} {group.topics.length === 1 ? "tópico" : "tópicos"}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[11px] text-slate-700 font-bold">
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Tópico do Edital</th>
                          <th className="p-2 w-16 text-center">Teoria</th>
                          <th className="p-2 w-16 text-center">Resumo</th>
                          <th className="p-2 w-16 text-center">Rev 24h</th>
                          <th className="p-2 w-16 text-center">Rev 7d</th>
                          <th className="p-2 w-16 text-center">Rev 30d</th>
                          <th className="p-2 w-24 text-center">Questões</th>
                          <th className="p-2 w-16 text-center">% Acerto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.topics.map((t, tIdx) => {
                          const isDone = Boolean(t.firstStudy && t.firstStudy !== "Pendente");
                          return (
                            <tr
                              key={t.id}
                              className={`border-b border-slate-200 text-slate-800 ${
                                tIdx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                              }`}
                            >
                              <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                                {(tIdx + 1).toString().padStart(2, "0")}
                              </td>
                              <td className="p-2 font-medium">
                                <span className={isDone ? "text-slate-900 font-semibold" : "text-slate-700"}>
                                  {t.title}
                                </span>
                              </td>
                              {/* Checkbox Teoria */}
                              <td className="p-2 text-center">
                                <div className="inline-block w-4 h-4 border border-slate-400 rounded-sm">
                                  {isDone && <span className="text-[10px] font-bold block leading-3 text-cyan-700">✓</span>}
                                </div>
                              </td>
                              {/* Checkbox Resumo */}
                              <td className="p-2 text-center">
                                <div className="inline-block w-4 h-4 border border-slate-400 rounded-sm" />
                              </td>
                              {/* Checkbox Rev 24h */}
                              <td className="p-2 text-center">
                                <div className="inline-block w-4 h-4 border border-slate-400 rounded-sm" />
                              </td>
                              {/* Checkbox Rev 7d */}
                              <td className="p-2 text-center">
                                <div className="inline-block w-4 h-4 border border-slate-400 rounded-sm" />
                              </td>
                              {/* Checkbox Rev 30d */}
                              <td className="p-2 text-center">
                                <div className="inline-block w-4 h-4 border border-slate-400 rounded-sm" />
                              </td>
                              {/* Questões */}
                              <td className="p-2 text-center text-slate-400 text-[10px] font-mono">
                                ____ / ____
                              </td>
                              {/* % Acerto */}
                              <td className="p-2 text-center text-slate-400 text-[10px] font-mono">
                                ____%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER DEDICADO PARA @media print */}
      <div id="synapse-printable-edital" className="hidden">
        <div style={{ fontFamily: "sans-serif", color: "#000", padding: "10px" }}>
          {/* Cabeçalho */}
          <div style={{ borderBottom: "2px solid #000", paddingBottom: "6px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#0891b2" }}>
                SYNAPSE AI • EDITAL VERTICALIZADO DE CONCURSO
              </div>
              <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "2px 0" }}>
                Checklist Oficial de Matérias: {careerName}
              </h1>
              <div style={{ fontSize: "10px", color: "#444" }}>
                Data: {new Date().toLocaleDateString("pt-BR")} | Tópicos Totais: {topics.length} | Concluídos: {stats.studied} ({stats.progress}%)
              </div>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "bold", border: "1px solid #000", padding: "4px 8px", borderRadius: "4px" }}>
              Cobertura: {stats.progress}%
            </div>
          </div>

          {/* Tabelas por Disciplina */}
          {groupedData.map((group, gIdx) => (
            <div key={group.subject.id || gIdx} style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
              <div style={{ background: "#1e293b", color: "#fff", padding: "4px 8px", fontWeight: "bold", fontSize: "11px", borderRadius: "3px", display: "flex", justifyContent: "space-between" }}>
                <span>{group.subject.name.toUpperCase()}</span>
                <span>{group.topics.length} tópicos</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginTop: "4px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", textAlign: "center" }}>
                    <th style={{ padding: "4px", width: "24px" }}>#</th>
                    <th style={{ padding: "4px", textAlign: "left" }}>Tópico</th>
                    <th style={{ padding: "4px", width: "36px" }}>Teoria</th>
                    <th style={{ padding: "4px", width: "36px" }}>Resumo</th>
                    <th style={{ padding: "4px", width: "36px" }}>24h</th>
                    <th style={{ padding: "4px", width: "36px" }}>7d</th>
                    <th style={{ padding: "4px", width: "36px" }}>30d</th>
                    <th style={{ padding: "4px", width: "60px" }}>Questões</th>
                    <th style={{ padding: "4px", width: "40px" }}>Acerto</th>
                  </tr>
                </thead>
                <tbody>
                  {group.topics.map((t, tIdx) => {
                    const isDone = Boolean(t.firstStudy && t.firstStudy !== "Pendente");
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0", background: tIdx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ padding: "4px", textAlign: "center", color: "#64748b" }}>{tIdx + 1}</td>
                        <td style={{ padding: "4px", fontWeight: isDone ? "bold" : "normal" }}>{t.title}</td>
                        <td style={{ padding: "4px", textAlign: "center" }}>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", border: "1px solid #64748b" }}>
                            {isDone ? "✓" : ""}
                          </span>
                        </td>
                        <td style={{ padding: "4px", textAlign: "center" }}><span style={{ display: "inline-block", width: "12px", height: "12px", border: "1px solid #64748b" }} /></td>
                        <td style={{ padding: "4px", textAlign: "center" }}><span style={{ display: "inline-block", width: "12px", height: "12px", border: "1px solid #64748b" }} /></td>
                        <td style={{ padding: "4px", textAlign: "center" }}><span style={{ display: "inline-block", width: "12px", height: "12px", border: "1px solid #64748b" }} /></td>
                        <td style={{ padding: "4px", textAlign: "center" }}><span style={{ display: "inline-block", width: "12px", height: "12px", border: "1px solid #64748b" }} /></td>
                        <td style={{ padding: "4px", textAlign: "center", color: "#94a3b8" }}>__ / __</td>
                        <td style={{ padding: "4px", textAlign: "center", color: "#94a3b8" }}>__%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
