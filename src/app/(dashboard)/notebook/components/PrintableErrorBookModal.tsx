"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  BookOpenCheck,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Eye,
  Clock,
  Sparkles,
  Layers,
  FileText,
  HelpCircle,
  Columns,
} from "lucide-react";
import { ErrorNotebookItem } from "@/types/quiz";
import { TAXONOMY_METADATA } from "@/lib/error-taxonomy";

interface PrintableErrorBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ErrorNotebookItem[];
  userName?: string | null;
  initialTab?: "print" | "anki";
}

const TAXONOMY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  TRICK_QUESTION: { label: "Pegadinha da Banca", icon: Eye },
  CONTENT_GAP: { label: "Lacuna Teórica", icon: Brain },
  THEORY_GAP: { label: "Lacuna Teórica", icon: Brain },
  ATTENTION_LAPSE: { label: "Falta de Atenção", icon: AlertTriangle },
  INTERPRETATION: { label: "Interpretação", icon: HelpCircle },
  MISINTERPRETATION: { label: "Interpretação", icon: HelpCircle },
  TIME_PRESSURE: { label: "Gestão do Tempo", icon: Clock },
  UNCLASSIFIED: { label: "Geral", icon: Layers },
};

export function PrintableErrorBookModal({
  isOpen,
  onClose,
  items,
  userName = "Concurseiro",
  initialTab = "print",
}: PrintableErrorBookModalProps) {
  const [activeTab, setActiveTab] = useState<"print" | "anki">(initialTab);
  const [selectedReason, setSelectedReason] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [onlyPending, setOnlyPending] = useState<boolean>(true);
  const [columns, setColumns] = useState<1 | 2>(1);
  const [ankiDownloaded, setAnkiDownloaded] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Lista de matérias únicas disponíveis nos itens
  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.subject?.id && item.subject?.name) {
        map.set(item.subject.id, item.subject.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Itens filtrados para impressão ou exportação
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyPending && item.status === "MASTERED") return false;
      if (selectedReason !== "ALL" && item.errorReason !== selectedReason) return false;
      if (selectedSubject !== "ALL" && item.subjectId !== selectedSubject) return false;
      return true;
    });
  }, [items, onlyPending, selectedReason, selectedSubject]);

  if (!isOpen) return null;

  // Disparo de impressão
  const handlePrint = () => {
    window.print();
  };

  // Exportação Anki (.txt delimitado por tabulação)
  const handleExportAnki = () => {
    if (filteredItems.length === 0) return;

    const lines: string[] = [];
    // Cabeçalho compatível com Anki
    lines.push("#separator:tab");
    lines.push("#html:true");
    lines.push("#tags column:3");

    filteredItems.forEach((item, idx) => {
      // Frente: Enunciado formatado e alternativas
      let frontHtml = `<div style="font-family:sans-serif; text-align:left; font-size:15px; line-height:1.6;">`;
      frontHtml += `<div style="color:#6366f1; font-weight:bold; font-size:12px; margin-bottom:8px;">[SYNAPSE CADERNO DE ERROS #${idx + 1}] ${item.subject?.name || "Geral"}</div>`;
      frontHtml += `<div>${item.questionText.replace(/\n/g, "<br>")}</div>`;

      if (item.options && Array.isArray(item.options)) {
        frontHtml += `<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:10px;">`;
        item.options.forEach((opt) => {
          frontHtml += `<div style="margin-bottom:6px; font-size:14px;"><strong>${opt.id})</strong> ${opt.texto}</div>`;
        });
        frontHtml += `</div>`;
      }
      frontHtml += `</div>`;

      // Verso: Gabarito, justificativa e alerta de pegadinha
      let backHtml = `<div style="font-family:sans-serif; text-align:left; font-size:14px; line-height:1.6;">`;
      backHtml += `<div style="background:#ecfdf5; border-left:4px solid #10b981; padding:8px 12px; margin-bottom:12px; border-radius:4px;">`;
      backHtml += `<strong style="color:#065f46; font-size:16px;">GABARITO OFICIAL: ${item.correctAnswer}</strong>`;
      if (item.userAnswer) {
        backHtml += `<div style="color:#991b1b; font-size:12px; margin-top:2px;">(Você havia marcado: ${item.userAnswer})</div>`;
      }
      backHtml += `</div>`;

      if (item.explanation) {
        backHtml += `<div style="margin-bottom:10px; color:#1e293b;"><strong>Fundamentação:</strong><br>${item.explanation.replace(/\n/g, "<br>")}</div>`;
      }

      if (item.aiExplanation) {
        backHtml += `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px 12px; border-radius:6px; margin-bottom:10px; font-size:13px;">`;
        backHtml += `<strong style="color:#4f46e5;">Diagnóstico da IA:</strong><br>${item.aiExplanation.replace(/\n/g, "<br>")}`;
        backHtml += `</div>`;
      }

      if (item.mnemonic) {
        backHtml += `<div style="background:#fef3c7; border:1px solid #f59e0b; padding:8px 12px; border-radius:6px; font-size:13px; color:#92400e;">`;
        backHtml += `<strong>💡 Mnemônico / Regra de Ouro:</strong> ${item.mnemonic}`;
        backHtml += `</div>`;
      }
      backHtml += `</div>`;

      const tags = `SynapseAI CadernoDeErros ${item.subject?.name?.replace(/\s+/g, "_") || "Geral"} ${item.errorReason || "Geral"}`;

      // Linha TSV limpa de quebras de linha brutas
      const cleanFront = frontHtml.replace(/\t/g, " ").replace(/[\r\n]+/g, " ");
      const cleanBack = backHtml.replace(/\t/g, " ").replace(/[\r\n]+/g, " ");
      lines.push(`${cleanFront}\t${cleanBack}\t${tags}`);
    });

    const fileContent = lines.join("\n");
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synapse-caderno-erros-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setAnkiDownloaded(true);
    setTimeout(() => setAnkiDownloaded(false), 4000);
  };

  return (
    <>
      {/* ESTILOS DE IMPRESSÃO ISOLADOS (@media print) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #synapse-printable-error-book,
          #synapse-printable-error-book * {
            visibility: visible;
          }
          #synapse-printable-error-book {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* MODAL DE TELA CHEIA / VISUALIZADOR */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-print">
        <div className="relative w-full max-w-5xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* HEADER DO MODAL */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                <BookOpenCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Apostila de Véspera & Exportação</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold">
                    {filteredItems.length} questões
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Leve seu Caderno de Erros diagramado para revisar antes da prova ou importe diretamente no Anki.
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

          {/* BARRA DE CONTROLE E FILTROS */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Abas Impressão vs Anki */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab("print")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "print"
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Printer size={14} />
                <span>Apostila / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("anki")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "anki"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Download size={14} />
                <span>Exportar Anki (.txt)</span>
              </button>
            </div>

            {/* Filtros em Linha */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Matéria */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas as Matérias</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              {/* Filtro de Taxonomia de Erro */}
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos os Motivos</option>
                <option value="TRICK_QUESTION">Pegadinha da Banca</option>
                <option value="CONTENT_GAP">Lacuna Teórica</option>
                <option value="ATTENTION_LAPSE">Falta de Atenção</option>
                <option value="INTERPRETATION">Interpretação</option>
                <option value="TIME_PRESSURE">Pressão de Tempo</option>
              </select>

              {/* Apenas Pendentes Checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold select-none px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5">
                <input
                  type="checkbox"
                  checked={onlyPending}
                  onChange={(e) => setOnlyPending(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <span>Apenas Pendentes</span>
              </label>

              {/* Seletor de Colunas (apenas no modo print) */}
              {activeTab === "print" && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setColumns(1)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      columns === 1
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                    title="Layout em 1 coluna"
                  >
                    1 Coluna
                  </button>
                  <button
                    type="button"
                    onClick={() => setColumns(2)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      columns === 2
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                    title="Layout em 2 colunas estilo prova"
                  >
                    2 Colunas
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CONTEÚDO PRINCIPAL (PREVIEW) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-[#070a13]">
            {activeTab === "print" ? (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Banner com botão de ação principal */}
                <div className="p-4 rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                      <Printer size={18} />
                      <span>Pronto para Impressão ou Salvar como PDF</span>
                    </h3>
                    <p className="text-xs text-violet-100 mt-0.5">
                      Clique no botão para abrir o diálogo do navegador. Selecione &quot;Salvar como PDF&quot; nas opções da impressora.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2.5 rounded-xl bg-white text-violet-700 hover:bg-violet-50 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                  >
                    <Printer size={15} />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                </div>

                {/* PRÉ-VISUALIZAÇÃO DA FOLHA DE IMPRESSÃO */}
                <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 font-serif">
                  {/* Cabeçalho da Apostila */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-sans font-black tracking-widest text-violet-700 uppercase">
                        SYNAPSE AI • SISTEMA COGNITIVO PARA CONCURSOS
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-slate-900">
                        Apostila de Véspera: Caderno de Erros & Pegadinhas
                      </h1>
                      <p className="text-xs font-sans text-slate-600 mt-0.5">
                        Aluno: <strong className="text-slate-900">{userName}</strong> • Gerado em:{" "}
                        {new Date().toLocaleDateString("pt-BR")} • Total:{" "}
                        <strong>{filteredItems.length} questões</strong>
                      </p>
                    </div>
                    <div className="text-right font-sans text-[11px] text-slate-500">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold border border-slate-300">
                        {onlyPending ? "Apenas Erros Pendentes" : "Histórico Completo"}
                      </span>
                    </div>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="py-12 text-center font-sans text-slate-500 text-sm">
                      Nenhuma questão encontrada com os filtros selecionados.
                    </div>
                  ) : (
                    <div
                      className={`gap-6 ${
                        columns === 2 ? "grid grid-cols-1 md:grid-cols-2" : "space-y-6"
                      }`}
                    >
                      {filteredItems.map((item, idx) => {
                        const taxInfo = TAXONOMY_LABELS[item.errorReason] || TAXONOMY_LABELS.UNCLASSIFIED;
                        const TaxIcon = taxInfo.icon;

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 break-inside-avoid"
                          >
                            {/* Header da Questão */}
                            <div className="flex items-center justify-between font-sans text-xs border-b border-slate-200 pb-2">
                              <span className="font-bold text-slate-900">
                                Questão #{idx + 1}{" "}
                                {item.subject?.name && (
                                  <span className="text-slate-500 font-normal">
                                    • {item.subject.name}
                                  </span>
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                <TaxIcon size={11} />
                                <span>{taxInfo.label}</span>
                              </span>
                            </div>

                            {/* Enunciado */}
                            <p className="text-[13px] leading-relaxed text-slate-800 select-text whitespace-pre-wrap">
                              {item.questionText}
                            </p>

                            {/* Alternativas */}
                            {item.options && Array.isArray(item.options) && (
                              <div className="space-y-1.5 font-sans text-xs pt-1 border-t border-slate-200/80">
                                {item.options.map((opt) => {
                                  const isCorrect = opt.id === item.correctAnswer;
                                  const isUserAnswer = opt.id === item.userAnswer;

                                  return (
                                    <div
                                      key={opt.id}
                                      className={`p-1.5 rounded flex items-start gap-2 ${
                                        isCorrect
                                          ? "bg-emerald-100 font-bold text-emerald-950 border border-emerald-300"
                                          : isUserAnswer
                                          ? "bg-rose-50 text-rose-900 border border-rose-200 line-through"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      <span className="font-mono font-bold shrink-0">
                                        ({opt.id})
                                      </span>
                                      <span>{opt.texto}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Bloco de Gabarito & Fundamentação */}
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-sans text-xs space-y-1.5">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-emerald-700">
                                  Gabarito: ({item.correctAnswer})
                                </span>
                                {item.userAnswer && (
                                  <span className="text-rose-600 text-[11px]">
                                    Sua resposta na prova: ({item.userAnswer})
                                  </span>
                                )}
                              </div>

                              {item.explanation && (
                                <p className="text-slate-700 text-[11.5px] leading-relaxed">
                                  <strong>Fundamentação:</strong> {item.explanation}
                                </p>
                              )}

                              {item.aiExplanation && (
                                <p className="text-indigo-900 text-[11.5px] leading-relaxed bg-indigo-50/80 p-1.5 rounded border border-indigo-100">
                                  <strong>Atenção da IA:</strong> {item.aiExplanation}
                                </p>
                              )}

                              {item.mnemonic && (
                                <p className="text-amber-900 text-[11px] font-bold bg-amber-50 p-1.5 rounded border border-amber-200">
                                  💡 Mnemônico: {item.mnemonic}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ABA DE EXPORTAÇÃO ANKI */
              <div className="max-w-2xl mx-auto space-y-5 py-4">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4 shadow-xl text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                      <Download size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Sincronização Nativa com Anki (.txt tabulado)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Exporte as <strong>{filteredItems.length} questões</strong> selecionadas em formato de cartões com Frente (enunciado e alternativas) e Verso (gabarito comentado e mnemônico).
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Como importar no Anki:
                    </span>
                    <ol className="list-decimal pl-4 space-y-1 text-[11.5px]">
                      <li>Baixe o arquivo clicando no botão abaixo.</li>
                      <li>Abra o Anki Desktop ou AnkiMobile.</li>
                      <li>Clique em <strong>Arquivo ➔ Importar</strong> e selecione o arquivo baixado.</li>
                      <li>
                        Certifique-se de que a opção <em>&quot;Permitir HTML nos campos&quot;</em> está marcada.
                      </li>
                      <li>Pronto! Todas as questões estarão marcadas com a tag <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500 font-mono">SynapseAI</code>.</li>
                    </ol>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExportAnki}
                      disabled={filteredItems.length === 0}
                      className="w-full py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {ankiDownloaded ? (
                        <>
                          <CheckCircle2 size={18} className="text-emerald-300" />
                          <span>Arquivo Baixado com Sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Baixar Arquivo para Anki ({filteredItems.length} Flashcards)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTAINER EXCLUSIVO DE IMPRESSÃO (Visível apenas em @media print) */}
      <div id="synapse-printable-error-book" className="hidden">
        <div style={{ fontFamily: "serif", color: "#000", padding: "10px" }}>
          {/* Cabeçalho */}
          <div
            style={{
              borderBottom: "2px solid #000",
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
              SYNAPSE AI • CADERNO DE ERROS & APOSTILA DE VÉSPERA
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: "4px 0" }}>
              Apostila de Revisão: Questões e Pegadinhas Catalogadas
            </h1>
            <div style={{ fontSize: "11px", color: "#444" }}>
              Candidato: <strong>{userName}</strong> | Data: {new Date().toLocaleDateString("pt-BR")} | Total: {filteredItems.length} questões
            </div>
          </div>

          {/* Questões */}
          <div
            style={{
              display: columns === 2 ? "grid" : "block",
              gridTemplateColumns: columns === 2 ? "1fr 1fr" : "1fr",
              gap: "16px",
            }}
          >
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  marginBottom: "12px",
                  borderRadius: "4px",
                  pageBreakInside: "avoid",
                  fontSize: "11.5px",
                  lineHeight: "1.4",
                }}
              >
                <div style={{ borderBottom: "1px solid #eee", paddingBottom: "4px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <strong>Questão #{idx + 1} • {item.subject?.name || "Geral"}</strong>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: "#666" }}>
                    [{TAXONOMY_LABELS[item.errorReason]?.label || "Geral"}]
                  </span>
                </div>

                <div style={{ marginBottom: "8px", whiteSpace: "pre-wrap" }}>
                  {item.questionText}
                </div>

                {item.options && Array.isArray(item.options) && (
                  <div style={{ marginBottom: "8px", paddingLeft: "8px" }}>
                    {item.options.map((opt) => (
                      <div
                        key={opt.id}
                        style={{
                          fontWeight: opt.id === item.correctAnswer ? "bold" : "normal",
                          color: opt.id === item.correctAnswer ? "#065f46" : "#222",
                          marginBottom: "2px",
                        }}
                      >
                        ({opt.id}) {opt.texto}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px", borderRadius: "3px", fontSize: "10.5px" }}>
                  <div>
                    <strong style={{ color: "#065f46" }}>Gabarito Oficial: ({item.correctAnswer})</strong>
                    {item.userAnswer && (
                      <span style={{ color: "#991b1b", marginLeft: "8px" }}>
                        (Você marcou: {item.userAnswer})
                      </span>
                    )}
                  </div>
                  {item.explanation && (
                    <div style={{ marginTop: "4px", color: "#333" }}>
                      <strong>Fundamentação:</strong> {item.explanation}
                    </div>
                  )}
                  {item.mnemonic && (
                    <div style={{ marginTop: "3px", color: "#92400e", fontWeight: "bold" }}>
                      💡 Mnemônico: {item.mnemonic}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
