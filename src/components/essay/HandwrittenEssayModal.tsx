"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Check,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  evaluateHandwrittenEssayAction,
  HandwrittenEssayResult,
} from "@/actions/handwritten-essay-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface HandwrittenEssayModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeTitle: string;
  banca: string;
  subjectArea?: string;
  motivatingText?: string;
  expectedPoints?: string;
  onEvaluationComplete?: (result: HandwrittenEssayResult) => void;
}

export function HandwrittenEssayModal({
  isOpen,
  onClose,
  themeTitle,
  banca,
  subjectArea,
  motivatingText,
  expectedPoints,
  onEvaluationComplete,
}: HandwrittenEssayModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>(
    "Inicializando leitura da caligrafia..."
  );

  const [result, setResult] = useState<HandwrittenEssayResult | null>(null);
  const [activeTab, setActiveTab] = useState<"transcription" | "mirror" | "golden">("mirror");

  const { playCorrect, playError, playLevelUp, playClick } = useSound();

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setResult(null);
    setLoading(false);
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
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMessage("Por favor, selecione uma foto (JPG, PNG) ou PDF da folha manuscrita.");
      playError();
      triggerHaptic("warning");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("O arquivo é muito grande. O limite máximo é de 20MB.");
      playError();
      triggerHaptic("warning");
      return;
    }

    playClick();
    triggerHaptic("light");
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleProcessHandwritten = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setErrorMessage(null);
    playClick();

    const stages = [
      "Decodificando traços da caligrafia cursiva...",
      "Mapeando e numerando linhas de 1 a 30...",
      "Auditando critérios da banca (Norma culta e tese)...",
      "Calculando nota no espelho e gerando versão nota 10...",
    ];

    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setProcessingStatus(stages[stageIdx]);
    }, 4500);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("themeTitle", themeTitle);
      formData.append("banca", banca);
      formData.append("subjectArea", subjectArea || "Geral");
      formData.append("motivatingText", motivatingText || "");
      formData.append("expectedPoints", expectedPoints || "");

      const res = await evaluateHandwrittenEssayAction(formData);

      clearInterval(stageInterval);

      if (res.success && res.data) {
        playLevelUp();
        triggerHaptic("heavy");
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}

        setResult(res.data);
        if (onEvaluationComplete) onEvaluationComplete(res.data);
      } else {
        playError();
        triggerHaptic("warning");
        setErrorMessage(
          res.error || "Não foi possível analisar a folha manuscrita enviada."
        );
      }
    } catch (err) {
      clearInterval(stageInterval);
      console.error("Erro ao avaliar manuscrito:", err);
      playError();
      triggerHaptic("warning");
      setErrorMessage("Falha inesperada ao comunicar com o examinador de IA.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Corretor de Folha Manuscrita
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  OCR de Caligrafia
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escreva à mão na folha de 30 linhas e envie a foto para correção oficial
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

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-sm text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ESTADO 1: FORMULÁRIO DE ENVIO */}
          {!result && !loading && (
            <div className="space-y-6">
              {/* Tema e Banca Ativos */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block">
                    Tema da Redação
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {themeTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                    Banca: {banca}
                  </span>
                </div>
              </div>

              {/* Área de Drag & Drop de Foto */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 bg-slate-50/50 dark:bg-slate-800/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-md shadow-rose-500/10">
                  <Camera className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Clique para tirar foto ou arraste a imagem da folha
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Suporta fotos de smartphone (JPG, PNG) ou digitalização em PDF (máx. 20MB)
                  </p>
                </div>
              </div>

              {/* Preview da Foto Selecionada */}
              {selectedFile && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview da Folha"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Pronto para avaliação
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ESTADO 2: PROCESSANDO COM IA */}
          {loading && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-rose-200 dark:border-rose-950 animate-pulse" />
                <div className="w-full h-full rounded-full border-4 border-rose-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-rose-500 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Examinando Folha Manuscrita
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {processingStatus}
                </p>
                <div className="text-xs text-slate-400 pt-2">
                  A IA está transcrevendo as linhas e auditando os quesitos com o
                  rigor da banca examinadora oficial.
                </div>
              </div>
            </div>
          )}

          {/* ESTADO 3: RESULTADO DA AVALIAÇÃO */}
          {result && !loading && (
            <div className="space-y-6">
              {/* Placar de Notas */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>Resultado Oficial da Banca {banca}</span>
                  </span>
                  <h3 className="text-2xl font-black">
                    Nota: {result.score} / {result.maxScore}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md">
                    {result.generalFeedback}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border shadow-md ${
                      result.isApproved
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/10"
                        : "bg-rose-500/20 border-rose-400 text-rose-300 shadow-rose-500/10"
                    }`}
                  >
                    {result.isApproved ? "Aprovado na Discursiva" : "Abaixo da Linha de Corte"}
                  </span>
                </div>
              </div>

              {/* Seletor de Abas */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("mirror")}
                  className={`pb-2.5 transition border-b-2 cursor-pointer ${
                    activeTab === "mirror"
                      ? "border-rose-500 text-rose-600 dark:text-rose-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Espelho da Banca ({result.criteriaScores.length} Critérios)
                </button>
                <button
                  onClick={() => setActiveTab("transcription")}
                  className={`pb-2.5 transition border-b-2 cursor-pointer ${
                    activeTab === "transcription"
                      ? "border-rose-500 text-rose-600 dark:text-rose-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Transcrição Linha a Linha ({result.lineCount} Linhas)
                </button>
                <button
                  onClick={() => setActiveTab("golden")}
                  className={`pb-2.5 transition border-b-2 cursor-pointer ${
                    activeTab === "golden"
                      ? "border-rose-500 text-rose-600 dark:text-rose-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Versão Nota 10 (Reescrita Modelo)
                </button>
              </div>

              {/* Conteúdo da Aba */}
              {activeTab === "mirror" && (
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    {result.criteriaScores.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {c.name}
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {c.awardedScore} / {c.maxScore}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {c.comments}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Desvios Linha a Linha */}
                  {result.lineErrors.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Apontamentos Microestruturais ({result.lineErrors.length} desvios):
                      </span>
                      <div className="space-y-2">
                        {result.lineErrors.map((err, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-xs space-y-1"
                          >
                            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                              <span className="px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 font-mono">
                                Linha {err.line}
                              </span>
                              <span>{err.errorType}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                              Trecho: <i>&ldquo;{err.excerpt}&rdquo;</i> — {err.explanation}
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Sugestão: {err.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "transcription" && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs space-y-1 max-h-[50vh] overflow-y-auto">
                  {result.transcription.map((l) => (
                    <div
                      key={l.lineNumber}
                      className="flex items-start gap-4 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1"
                    >
                      <span className="w-6 text-right font-bold text-slate-400 select-none">
                        {l.lineNumber}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 leading-snug">
                        {l.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "golden" && (
                <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Redação Lapidada (Padrão de Ouro)</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium">
                    {result.goldenVersion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          {!result ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Certifique-se de que a foto esteja com boa iluminação e foco nítido.
              </span>

              <button
                disabled={!selectedFile || loading}
                onClick={handleProcessHandwritten}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-rose-200" />
                <span>Avaliar Folha com IA</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Enviar Outra Folha</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm transition cursor-pointer active:scale-95"
              >
                Concluir e Voltar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
