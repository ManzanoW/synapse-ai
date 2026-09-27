"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Save,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import {
  parseExamPdfAction,
  saveImportedExamToQuizAction,
  ParsedExamData,
  ParsedExamQuestion,
} from "@/actions/pdf-exam-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface PDFExamImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamSaved?: (quizId: string) => void;
}

type ImportStep = "UPLOAD" | "PROCESSING" | "REVIEW" | "SAVING";

export function PDFExamImporterModal({
  isOpen,
  onClose,
  onExamSaved,
}: PDFExamImporterModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>(
    "Inicializando leitura multimodal..."
  );

  const [parsedExam, setParsedExam] = useState<ParsedExamData | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  const { playCorrect, playError, playLevelUp, playClick } = useSound();

  const handleReset = () => {
    setStep("UPLOAD");
    setSelectedFile(null);
    setErrorMessage(null);
    setParsedExam(null);
    setExpandedQuestion(0);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor, selecione exclusivamente um arquivo PDF de prova.");
      playError();
      triggerHaptic("warning");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("O arquivo excede o limite máximo permitido de 25MB.");
      playError();
      triggerHaptic("warning");
      return;
    }

    playClick();
    triggerHaptic("light");
    setSelectedFile(file);
  };

  const handleProcessPdf = async () => {
    if (!selectedFile) return;

    setStep("PROCESSING");
    setErrorMessage(null);
    playClick();

    const stages = [
      "Lendo páginas do caderno de prova em alta fidelidade...",
      "Identificando banca, cargo, ano e matérias...",
      "Dissecando enunciados, textos motivadores e alternativas...",
      "Consolidando gabarito oficial e formatando simulado...",
    ];

    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setProcessingStatus(stages[stageIdx]);
    }, 4500);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await parseExamPdfAction(formData);

      clearInterval(stageInterval);

      if (res.success && res.exam) {
        playCorrect();
        triggerHaptic("success");
        setParsedExam(res.exam);
        setStep("REVIEW");
      } else {
        playError();
        triggerHaptic("warning");
        setErrorMessage(
          res.error || "Não foi possível extrair as questões do PDF fornecido."
        );
        setStep("UPLOAD");
      }
    } catch (err) {
      clearInterval(stageInterval);
      console.error("Erro ao analisar PDF:", err);
      playError();
      triggerHaptic("warning");
      setErrorMessage("Erro inesperado ao conectar com a IA de dissecação.");
      setStep("UPLOAD");
    }
  };

  const handleUpdateGabarito = (questionIndex: number, newGabarito: string) => {
    if (!parsedExam) return;
    playClick();
    const updated = { ...parsedExam };
    updated.questoes[questionIndex].gabarito = newGabarito;
    setParsedExam(updated);
  };

  const handleStartExamNow = async () => {
    if (!parsedExam) return;
    setStep("SAVING");
    try {
      const res = await saveImportedExamToQuizAction({ exam: parsedExam });
      if (res.success && res.quizId) {
        playLevelUp();
        triggerHaptic("heavy");
        if (onExamSaved) onExamSaved(res.quizId);
        onClose();
        router.push(`/quiz/timed?quizId=${res.quizId}`);
      } else {
        playError();
        setErrorMessage(res.error || "Falha ao iniciar o simulado.");
        setStep("REVIEW");
      }
    } catch (err) {
      console.error(err);
      playError();
      setErrorMessage("Falha ao salvar simulado.");
      setStep("REVIEW");
    }
  };

  const handleSaveToAcervoOnly = async () => {
    if (!parsedExam) return;
    setStep("SAVING");
    try {
      const res = await saveImportedExamToQuizAction({ exam: parsedExam });
      if (res.success && res.quizId) {
        playCorrect();
        triggerHaptic("success");
        if (onExamSaved) onExamSaved(res.quizId);
        onClose();
        handleReset();
      } else {
        playError();
        setErrorMessage(res.error || "Falha ao salvar no acervo.");
        setStep("REVIEW");
      }
    } catch (err) {
      console.error(err);
      playError();
      setErrorMessage("Erro ao registrar prova.");
      setStep("REVIEW");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Importador de Provas em PDF
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                  OCR Multimodal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arraste qualquer prova de banca para convertê-la em um simulado interativo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo de Acordo com a Etapa */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Mensagem de Erro Geral */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ETAPA 1: UPLOAD / SELEÇÃO */}
          {step === "UPLOAD" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]"
                    : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/10">
                  <FileText className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                    Arraste o arquivo PDF da prova aqui
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Ou clique para buscar nos seus arquivos locais (máx. 25MB)
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                    CEBRASPE (C/E e M.E.)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                    FGV
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                    FCC
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                    VUNESP
                  </span>
                </div>
              </div>

              {/* Arquivo Selecionado */}
              {selectedFile && (
                <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow">
                      PDF
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-sm sm:max-w-md">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 2: PROCESSANDO COM IA */}
          {step === "PROCESSING" && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-950 animate-pulse" />
                <div className="w-full h-full rounded-full border-4 border-indigo-600 border-t-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-500 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Dissecando Caderno de Questões
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {processingStatus}
                </p>
                <div className="text-xs text-slate-400 dark:text-slate-500 pt-2">
                  Nosso modelo multimodal está lendo texto corrido, tabelas e
                  identificando alternativas e gabarito.
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: REVISÃO (STAGING AREA) */}
          {step === "REVIEW" && parsedExam && (
            <div className="space-y-6">
              {/* Card de Resumo da Prova Identificada */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-sm">
                      {parsedExam.banca}
                    </span>
                    {parsedExam.ano && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {parsedExam.ano}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{parsedExam.questoes.length} Questões Dissecadas</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {parsedExam.titulo}
                </h3>

                <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  {parsedExam.cargo && (
                    <div>
                      <span className="font-semibold text-slate-500">Cargo:</span>{" "}
                      {parsedExam.cargo}
                    </div>
                  )}
                  {parsedExam.orgao && (
                    <div>
                      <span className="font-semibold text-slate-500">Órgão:</span>{" "}
                      {parsedExam.orgao}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista Acordeão de Questões Dissecadas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                  <span>Conferência de Questões & Gabaritos:</span>
                  <span>Clique para expandir/revisar</span>
                </div>

                <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                  {parsedExam.questoes.map((q, idx) => {
                    const isExpanded = expandedQuestion === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden transition"
                      >
                        {/* Linha de Cabeçalho do Card */}
                        <button
                          onClick={() =>
                            setExpandedQuestion(isExpanded ? null : idx)
                          }
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                              #{q.numero}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shrink-0">
                              {q.materia}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
                              {q.enunciado}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                              Gabarito: {q.gabarito || "—"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Corpo Expandido */}
                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4 text-xs sm:text-sm">
                            <p className="leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium">
                              {q.enunciado}
                            </p>

                            <div className="space-y-2">
                              {q.options.map((opt) => {
                                const isCorrect =
                                  opt.id.toUpperCase() ===
                                  q.gabarito?.toUpperCase();
                                return (
                                  <div
                                    key={opt.id}
                                    onClick={() =>
                                      handleUpdateGabarito(idx, opt.id)
                                    }
                                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                      isCorrect
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 font-medium text-emerald-900 dark:text-emerald-100"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <span
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                          isCorrect
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        }`}
                                      >
                                        {opt.id}
                                      </span>
                                      <span className="pt-0.5 leading-snug">
                                        {opt.texto}
                                      </span>
                                    </div>

                                    {isCorrect && (
                                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Gabarito</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {q.explicacao && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                                {q.explicacao}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: SALVANDO */}
          {step === "SAVING" && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-500" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Gerando Simulado Interativo...
              </h4>
              <p className="text-xs text-slate-400">
                Configurando cronômetro e folha de respostas.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          {step === "UPLOAD" && (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Selecione o arquivo da prova para iniciar a extração.
              </span>
              <button
                disabled={!selectedFile}
                onClick={handleProcessPdf}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Processar Prova com IA</span>
              </button>
            </>
          )}

          {step === "REVIEW" && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                Trocar Arquivo
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={handleSaveToAcervoOnly}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar no Meu Acervo</span>
                </button>

                <button
                  onClick={handleStartExamNow}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Simulado Agora</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
