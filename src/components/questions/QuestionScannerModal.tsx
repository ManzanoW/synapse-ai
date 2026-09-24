"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BookmarkPlus,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Plus,
  HelpCircle,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  scanQuestionFromImageAction,
  saveScannedQuestionToNotebookAction,
  saveScannedQuestionToFlashcardAction,
  ScannedQuestionResult,
} from "@/actions/ocr-question-actions";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import { QuestaoIA } from "@/app/(dashboard)/questions/page";

interface QuestionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestionToQuiz?: (question: QuestaoIA) => void;
}

export function QuestionScannerModal({
  isOpen,
  onClose,
  onAddQuestionToQuiz,
}: QuestionScannerModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scannedResult, setScannedResult] = useState<ScannedQuestionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interatividade da questão escaneada
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasRevealedAnswer, setHasRevealedAnswer] = useState(false);
  const [isSavedToNotebook, setIsSavedToNotebook] = useState(false);
  const [isSavingNotebook, setIsSavingNotebook] = useState(false);
  const [isSavedToFlashcards, setIsSavedToFlashcards] = useState(false);
  const [isSavingFlashcards, setIsSavingFlashcards] = useState(false);
  const [isAddedToQuiz, setIsAddedToQuiz] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Rewarded Ad Modal
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    "Digitalizando caligrafia e tipografia com Visão Computacional...",
    "Estruturando enunciado e isolando alternativas...",
    "Consultando jurisprudência do STF/STJ e legislação seca...",
    "Mapeando armadilhas e pegadinhas da banca examinadora...",
    "Gerando mnemônico e flashcard para retenção acelerada...",
  ];

  // Alterna mensagens do scanner durante o loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev + 1) % scanSteps.length);
      }, 2400);
    }
    return () => clearInterval(interval);
  }, [isScanning, scanSteps.length]);

  // Suporte a colar imagem (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileSelect(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMsg("Selecione um arquivo de imagem válido (JPG, PNG, WEBP).");
      return;
    }
    setErrorMsg(null);
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScannedResult(null);
    setSelectedOptionId(null);
    setHasRevealedAnswer(false);
    setIsSavedToNotebook(false);
    setIsSavedToFlashcards(false);
    setIsAddedToQuiz(false);
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setScannedResult(null);
    setErrorMsg(null);
    setSelectedOptionId(null);
    setHasRevealedAnswer(false);
    setIsSavedToNotebook(false);
    setIsSavedToFlashcards(false);
    setIsAddedToQuiz(false);
  };

  const handleStartScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setErrorMsg(null);
    setScanStepIndex(0);

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await scanQuestionFromImageAction(formData);

      if (res.quotaExceeded) {
        setIsAdModalOpen(true);
        setIsScanning(false);
        return;
      }

      if (!res.success || !res.data) {
        setErrorMsg(res.error || "Não foi possível analisar a questão.");
        setIsScanning(false);
        return;
      }

      setScannedResult(res.data);
      // Dispara confetti de leitura com sucesso
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro de conexão ao processar imagem.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (selectedOptionId) return; // Já respondeu
    setSelectedOptionId(optionId);
    setHasRevealedAnswer(true);

    if (scannedResult && optionId === scannedResult.gabaritoCorreto) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const handleSaveToNotebook = async () => {
    if (!scannedResult || isSavedToNotebook || isSavingNotebook) return;

    setIsSavingNotebook(true);
    try {
      const res = await saveScannedQuestionToNotebookAction({
        questionText: scannedResult.enunciado,
        options: scannedResult.alternativas,
        userAnswer: selectedOptionId || scannedResult.gabaritoCorreto,
        correctAnswer: scannedResult.gabaritoCorreto,
        explanation: scannedResult.justificativa,
        aiExplanation: scannedResult.justificativa,
        mnemonic: scannedResult.pegadinhaBanca,
        disciplina: scannedResult.disciplina,
        assunto: scannedResult.assunto,
      });

      if (res.success) {
        setIsSavedToNotebook(true);
      } else {
        alert(res.error || "Erro ao salvar no caderno.");
      }
    } catch {
      alert("Erro ao salvar no caderno.");
    } finally {
      setIsSavingNotebook(false);
    }
  };

  const handleSaveToFlashcards = async () => {
    if (!scannedResult || isSavedToFlashcards || isSavingFlashcards) return;

    setIsSavingFlashcards(true);
    try {
      const res = await saveScannedQuestionToFlashcardAction({
        front: scannedResult.flashcardFrente || scannedResult.enunciado.slice(0, 160) + "...",
        back: scannedResult.flashcardVerso || `Gabarito: ${scannedResult.gabaritoCorreto}\n\n${scannedResult.justificativa}`,
        details: scannedResult.justificativa,
        deckName: scannedResult.disciplina || "Questões Escaneadas (OCR)",
      });

      if (res.success) {
        setIsSavedToFlashcards(true);
      } else {
        alert(res.error || "Erro ao criar flashcard.");
      }
    } catch {
      alert("Erro ao criar flashcard.");
    } finally {
      setIsSavingFlashcards(false);
    }
  };

  const handleAddToQuiz = () => {
    if (!scannedResult || isAddedToQuiz || !onAddQuestionToQuiz) return;

    const formattedQuestion: QuestaoIA = {
      enunciado: scannedResult.enunciado,
      formato: scannedResult.formato,
      justificativa: scannedResult.justificativa,
      pegadinhaBanca: scannedResult.pegadinhaBanca,
      alternativas: scannedResult.alternativas,
      gabaritoCorreto: scannedResult.gabaritoCorreto,
      flashcardFrente: scannedResult.flashcardFrente,
      flashcardVerso: scannedResult.flashcardVerso,
    };

    onAddQuestionToQuiz(formattedQuestion);
    setIsAddedToQuiz(true);
  };

  const handleCopyText = () => {
    if (!scannedResult) return;
    const text = `DISCIPLINA: ${scannedResult.disciplina} | ASSUNTO: ${scannedResult.assunto}\n\n${scannedResult.enunciado}\n\n` +
      scannedResult.alternativas.map((a) => `${a.id}) ${a.texto}`).join("\n") +
      `\n\nGABARITO: ${scannedResult.gabaritoCorreto}\nJUSTIFICATIVA: ${scannedResult.justificativa}\nPEGADINHA DA BANCA: ${scannedResult.pegadinhaBanca}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92dvh] flex flex-col rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden my-auto">
        {/* Glow de fundo */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-cyan-600/15 blur-[100px] pointer-events-none" />

        {/* CABEÇALHO */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-linear-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Scanner OCR de Questões
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Visão IA
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Fotografe apostilas físicas, livros ou cole prints para resolver na hora
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            title="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="relative flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Se nenhuma imagem foi selecionada */}
          {!previewUrl && (
            <div className="space-y-4">
              {/* ÁREA DE DRAG & DROP / PASTE */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className="relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed border-white/15 hover:border-violet-500/50 rounded-2xl bg-white/[0.02] hover:bg-violet-500/[0.03] transition-all text-center cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-110 transition-transform mb-3">
                  <Upload size={28} />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  Arraste uma foto aqui ou cole da área de transferência
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Dica: Você pode pressionar <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px]">Ctrl+V</kbd> para colar um print da tela diretamente!
                </p>
              </div>

              {/* BOTÕES DE CAPTURA RÁPIDA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Botão Câmera (Mobile Friendly com capture="environment") */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border border-violet-500/30 bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 font-bold text-xs transition-all active:scale-95 shadow-md shadow-violet-950/20"
                >
                  <Camera size={17} className="text-violet-400" />
                  <span>Tirar Foto com a Câmera</span>
                </button>

                {/* Botão Escolher Arquivo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/60 text-zinc-200 font-bold text-xs transition-all active:scale-95"
                >
                  <FileText size={17} className="text-zinc-400" />
                  <span>Escolher Foto da Galeria / Arquivo</span>
                </button>
              </div>

              {/* Inputs invisíveis */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* Se imagem selecionada mas AINDA NÃO escaneada ou ESTÁ escaneando */}
          {previewUrl && !scannedResult && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 max-h-[340px] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Pré-visualização da questão"
                  className="max-h-[340px] w-auto object-contain"
                />

                {/* Linha laser de Scanner animada */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse absolute top-1/2 -translate-y-1/2" />
                    <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
                  </div>
                )}
              </div>

              {isScanning ? (
                <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-950/20 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-violet-400 font-semibold text-xs">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processando Visão Computacional...</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">
                    {scanSteps[scanStepIndex]}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs transition-all flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>Trocar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartScan}
                    className="flex-1 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-violet-600/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={16} className="text-amber-300" />
                    <span>Digitalizar e Analisar com IA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MENSAGEM DE ERRO SE HOUVER */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= RESULTADO INTERATIVO DA QUESTÃO ================= */}
          {scannedResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Badges de Metadados e Copiar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {scannedResult.disciplina || "Geral"}
                  </span>
                  {scannedResult.assunto && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-zinc-300 border border-white/10">
                      {scannedResult.assunto}
                    </span>
                  )}
                  {scannedResult.bancaSugerida && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {scannedResult.bancaSugerida} {scannedResult.anoSugerido || ""}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-white/[0.03]">
                    {scannedResult.formato === "CERTO_ERRADO" ? "Certo/Errado" : "Múltipla Escolha"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs flex items-center gap-1.5 transition-all"
                  title="Copiar questão completa"
                >
                  {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>

              {/* Enunciado da Questão */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] text-sm text-zinc-200 leading-relaxed font-serif whitespace-pre-wrap selection:bg-violet-500/30">
                {scannedResult.enunciado}
              </div>

              {/* Lista de Alternativas Interativas */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Selecione sua resposta para testar seu conhecimento:
                </span>
                {scannedResult.alternativas.map((alt) => {
                  const isSelected = selectedOptionId === alt.id;
                  const isCorrect = alt.id === scannedResult.gabaritoCorreto;

                  let cardStyle =
                    "border-white/10 bg-slate-900/40 text-zinc-300 hover:border-violet-500/40 hover:bg-violet-500/5";
                  let badgeStyle = "bg-white/10 text-zinc-300 border-white/10";

                  if (hasRevealedAnswer) {
                    if (isCorrect) {
                      cardStyle =
                        "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                      badgeStyle = "bg-emerald-500 text-slate-950 font-black border-emerald-400";
                    } else if (isSelected && !isCorrect) {
                      cardStyle = "border-red-500/50 bg-red-500/10 text-red-200";
                      badgeStyle = "bg-red-500 text-white font-black border-red-400";
                    }
                  } else if (isSelected) {
                    cardStyle = "border-violet-500 bg-violet-500/15 text-white";
                    badgeStyle = "bg-violet-500 text-white border-violet-400";
                  }

                  return (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => handleOptionSelect(alt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${cardStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${badgeStyle}`}
                      >
                        {alt.id}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                        {alt.texto}
                      </span>
                      {hasRevealedAnswer && isCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botão de Revelar se o usuário não quiser testar */}
              {!hasRevealedAnswer && (
                <button
                  type="button"
                  onClick={() => setHasRevealedAnswer(true)}
                  className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 text-xs font-bold transition-all text-center"
                >
                  Revelar Gabarito e Justificativa Fundamentada
                </button>
              )}

              {/* ================= GABARITO & FUNDAMENTAÇÃO ================= */}
              {hasRevealedAnswer && (
                <div className="space-y-3.5 pt-2 animate-fade-in">
                  {/* Feedback de Acerto/Erro */}
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                      selectedOptionId === scannedResult.gabaritoCorreto
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                        : "border-amber-500/40 bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    <ShieldCheck size={20} className="shrink-0" />
                    <div className="text-xs font-medium">
                      <span className="font-extrabold text-white mr-1.5">
                        Gabarito Oficial: Letra {scannedResult.gabaritoCorreto}
                      </span>
                      {selectedOptionId === scannedResult.gabaritoCorreto
                        ? "Excelente! Você acertou a questão no alvo."
                        : "Revise a fundamentação abaixo para não cair na pegadinha da banca."}
                    </div>
                  </div>

                  {/* Justificativa Detalhada */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                      <FileText size={15} />
                      <span>Fundamentação Jurídica & Teórica</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {scannedResult.justificativa}
                    </p>
                  </div>

                  {/* 🚨 Alerta de Pegadinha da Banca */}
                  {scannedResult.pegadinhaBanca && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle size={15} />
                        <span>Alerta de Pegadinha da Banca</span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-amber-200/90 leading-relaxed">
                        {scannedResult.pegadinhaBanca}
                      </p>
                    </div>
                  )}

                  {/* Mini-Card do Flashcard FSRS */}
                  {scannedResult.flashcardFrente && (
                    <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                          <Layers size={15} />
                          <span>Flashcard para Memorização (FSRS)</span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-200">
                        <p className="font-semibold text-indigo-200 mb-1">
                          Q: {scannedResult.flashcardFrente}
                        </p>
                        <p className="text-zinc-400">
                          R: {scannedResult.flashcardVerso}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ COM AÇÕES */}
        {scannedResult && (
          <div className="relative px-5 py-3.5 border-t border-white/[0.08] bg-slate-900/60 flex items-center justify-between gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Escanear Outra</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Botão Salvar no Caderno de Erros */}
              <button
                type="button"
                onClick={handleSaveToNotebook}
                disabled={isSavedToNotebook || isSavingNotebook}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSavedToNotebook
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 cursor-pointer"
                }`}
              >
                {isSavingNotebook ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : isSavedToNotebook ? (
                  <Check size={13} />
                ) : (
                  <BookmarkPlus size={13} />
                )}
                <span>{isSavedToNotebook ? "No Caderno" : "Caderno de Erros"}</span>
              </button>

              {/* Botão Criar Flashcard FSRS */}
              <button
                type="button"
                onClick={handleSaveToFlashcards}
                disabled={isSavedToFlashcards || isSavingFlashcards}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSavedToFlashcards
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer"
                }`}
              >
                {isSavingFlashcards ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : isSavedToFlashcards ? (
                  <Check size={13} />
                ) : (
                  <Layers size={13} />
                )}
                <span>{isSavedToFlashcards ? "Flashcard Salvo" : "+ Flashcard"}</span>
              </button>

              {/* Botão Injetar no Simulado Atual (se houver callback) */}
              {onAddQuestionToQuiz && (
                <button
                  type="button"
                  onClick={handleAddToQuiz}
                  disabled={isAddedToQuiz}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAddedToQuiz
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                      : "bg-linear-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer"
                  }`}
                >
                  {isAddedToQuiz ? <Check size={13} /> : <Plus size={13} />}
                  <span>{isAddedToQuiz ? "Adicionada à Prova" : "Adicionar à Prova"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Rewarded Ad caso a cota do plano gratuito tenha sido atingida */}
      <RewardedAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        feature="OCR_QUESTION"
        onRewardClaimed={() => {
          setIsAdModalOpen(false);
          handleStartScan();
        }}
      />
    </div>
  );
}
