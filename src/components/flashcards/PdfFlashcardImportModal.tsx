"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileUp,
  X,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Zap,
  ShieldCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  Loader2,
  Sliders,
  RotateCcw,
  Headphones,
  Download,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  parsePdfAndExtractTopicsAction,
  generateCardsFromTopicAction,
  generateQuizFromPdfTopicAction,
  ExtractedTopicItem,
} from "@/actions/pdf-flashcard-actions";
import { AnkiExportModal } from "./AnkiExportModal";
import { AudioFlashcardPlayerModal } from "./AudioFlashcardPlayerModal";
import { AudioFlashcardItem } from "@/hooks/useAudioFlashcards";

interface PdfFlashcardImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks?: Array<{ id: string; title: string }>;
}

type OutputType = "FLASHCARDS" | "QUIZ";
type GenerationMode = "CLOZE_AND_CONCEPTS" | "LAW_EXCEPTIONS" | "DEADLINES_AND_NUMBERS";

interface GeneratedCardItem {
  id: string;
  question: string;
  answer: string;
  details: string | null;
  topicTitle: string;
}

export function PdfFlashcardImportModal({
  isOpen,
  onClose,
  decks = [],
}: PdfFlashcardImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estados de Fluxo
  const [step, setStep] = useState<"UPLOAD" | "SELECT_TOPICS" | "GENERATING" | "SUCCESS">("UPLOAD");
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState("Lendo páginas do PDF...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dados extraídos do PDF
  const [pdfName, setPdfName] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [totalCleanChars, setTotalCleanChars] = useState(0);
  const [topics, setTopics] = useState<ExtractedTopicItem[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Tipo de Saída: Flashcards vs Simulado
  const [outputType, setOutputType] = useState<OutputType>("FLASHCARDS");

  // Configurações de Flashcards
  const [deckMode, setDeckMode] = useState<"NEW" | "EXISTING">("NEW");
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || "");
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("CLOZE_AND_CONCEPTS");
  const [cardsPerTopic, setCardsPerTopic] = useState<number>(8);

  // Configurações de Simulado
  const [quizBanca, setQuizBanca] = useState<string>("Cebraspe");
  const [quizDificuldade, setQuizDificuldade] = useState<string>("Médio");
  const [quizQuestionsCount, setQuizQuestionsCount] = useState<number>(5);

  // Progresso de Geração
  const [generatingProgress, setGeneratingProgress] = useState<{
    current: number;
    total: number;
    currentTopicTitle: string;
  }>({ current: 0, total: 0, currentTopicTitle: "" });

  // Resultados
  const [generatedCards, setGeneratedCards] = useState<GeneratedCardItem[]>([]);
  const [finalDeckId, setFinalDeckId] = useState<string>("");
  const [finalDeckTitle, setFinalDeckTitle] = useState<string>("");
  const [finalQuizId, setFinalQuizId] = useState<string>("");
  const [finalQuizCount, setFinalQuizCount] = useState<number>(0);

  // Modais Secundários (Anki e Áudio)
  const [isAnkiExportOpen, setIsAnkiExportOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPdfFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processPdfFile(file);
  };

  const processPdfFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor, selecione um arquivo válido com extensão .pdf");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("O PDF é maior que 25MB. Por favor, envie um arquivo menor.");
      return;
    }

    setErrorMessage(null);
    setIsParsing(true);
    setParsingStatus("Carregando documento e extraindo texto...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setTimeout(() => {
        setParsingStatus("Higienizando ruídos, cabeçalhos e rodapés (0 tokens)...");
      }, 700);

      setTimeout(() => {
        setParsingStatus("Segmentando tópicos e capítulos didáticos...");
      }, 1500);

      const res = await parsePdfAndExtractTopicsAction(formData);

      if (!res.success || !res.topics || res.topics.length === 0) {
        setErrorMessage(res.error || "Não foi possível extrair tópicos do PDF.");
        setIsParsing(false);
        return;
      }

      setPdfName(res.pdfName || file.name);
      setTotalPages(res.totalPages || 0);
      setTotalCleanChars(res.totalCleanChars || 0);
      setTopics(res.topics);

      const defaultTitle = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
      setNewDeckTitle(defaultTitle);

      setSelectedTopicIds(new Set(res.topics.map((t) => t.id)));
      setStep("SELECT_TOPICS");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro inesperado ao processar o PDF."
      );
    } finally {
      setIsParsing(false);
    }
  };

  const toggleTopic = (id: string) => {
    const next = new Set(selectedTopicIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTopicIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedTopicIds.size === topics.length) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(topics.map((t) => t.id)));
    }
  };

  const handleStartGeneration = async () => {
    const selectedTopicsList = topics.filter((t) => selectedTopicIds.has(t.id));

    if (selectedTopicsList.length === 0) {
      setErrorMessage("Selecione ao menos 1 tópico para o processamento.");
      return;
    }

    setErrorMessage(null);
    setStep("GENERATING");
    setGeneratingProgress({
      current: 0,
      total: selectedTopicsList.length,
      currentTopicTitle: selectedTopicsList[0].title,
    });

    try {
      if (outputType === "FLASHCARDS") {
        const allCreated: GeneratedCardItem[] = [];
        let savedDeckId = deckMode === "EXISTING" ? selectedDeckId : undefined;
        let savedDeckTitle = deckMode === "NEW" ? newDeckTitle.trim() : undefined;

        for (let i = 0; i < selectedTopicsList.length; i++) {
          const topic = selectedTopicsList[i];
          setGeneratingProgress({
            current: i + 1,
            total: selectedTopicsList.length,
            currentTopicTitle: topic.title,
          });

          const res = await generateCardsFromTopicAction({
            topicId: topic.id,
            topicTitle: topic.title,
            text: topic.cleanedText,
            deckId: savedDeckId,
            deckTitle: savedDeckTitle,
            targetCount: cardsPerTopic,
            mode: generationMode,
          });

          if (res.success && res.cards) {
            if (!savedDeckId && res.deckId) {
              savedDeckId = res.deckId;
              savedDeckTitle = res.deckTitle;
            }

            res.cards.forEach((c) => {
              allCreated.push({
                id: c.id,
                question: c.question,
                answer: c.answer,
                details: c.details,
                topicTitle: topic.title,
              });
            });
          }
        }

        if (allCreated.length === 0) {
          throw new Error("Não foi possível gerar os cards para os tópicos selecionados.");
        }

        setGeneratedCards(allCreated);
        setFinalDeckId(savedDeckId || "");
        setFinalDeckTitle(savedDeckTitle || "Novo Baralho");
        setStep("SUCCESS");
      } else {
        // Geração de Simulado / Questões
        const primaryTopic = selectedTopicsList[0];
        const combinedText = selectedTopicsList.map((t) => t.cleanedText).join("\n\n");

        const res = await generateQuizFromPdfTopicAction({
          topicTitle:
            selectedTopicsList.length === 1
              ? primaryTopic.title
              : `${pdfName.replace(/\.pdf$/i, "")} (${selectedTopicsList.length} tópicos)`,
          text: combinedText,
          banca: quizBanca,
          qtdQuestoes: quizQuestionsCount,
          dificuldade: quizDificuldade,
        });

        if (!res.success || !res.quizId) {
          throw new Error(res.error || "Falha ao gerar o simulado com questões.");
        }

        setFinalQuizId(res.quizId);
        setFinalQuizCount(res.count || quizQuestionsCount);
        setStep("SUCCESS");
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro durante a geração com IA."
      );
      setStep("SELECT_TOPICS");
    }
  };

  const handleReset = () => {
    setStep("UPLOAD");
    setTopics([]);
    setSelectedTopicIds(new Set());
    setGeneratedCards([]);
    setErrorMessage(null);
    setPdfName("");
    setTotalPages(0);
    setTotalCleanChars(0);
    setFinalDeckId("");
    setFinalQuizId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const audioItems: AudioFlashcardItem[] = generatedCards.map((c) => ({
    id: c.id,
    question: c.question,
    answer: c.answer,
    details: c.details,
  }));

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl max-h-[90vh] my-auto flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
          {/* CABEÇALHO */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-400">
                <FileUp size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Importador Inteligente de PDF
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck size={11} /> 0 Tokens Desperdiçados
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Higienização no servidor com extração para Flashcards ou Simulado
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* CORPO MODAL */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ETAPA 1: UPLOAD */}
            {step === "UPLOAD" && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={handleDrop}
                  onClick={() => !isParsing && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isParsing
                      ? "border-indigo-500/40 bg-indigo-950/20 cursor-wait"
                      : "border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-indigo-950/10"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isParsing}
                  />

                  {isParsing ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Loader2 size={36} className="text-indigo-400 animate-spin" />
                      <div className="space-y-1 text-center">
                        <p className="text-sm font-bold text-white">{parsingStatus}</p>
                        <p className="text-xs text-slate-400">
                          Processando documento localmente no servidor
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
                        <FileUp size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">
                          Clique ou arraste seu arquivo PDF aqui
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Apostilas de cursinho, leis esquematizadas ou resumos (até 25MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      <span>0 Tokens Gastos no PDF</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Capas, sumários e rodapés repetidos são expurgados no backend.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                      <Layers size={14} className="text-violet-400" />
                      <span>Cards & Simulados</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Gere flashcards para repetição espaçada ou um simulado de questões.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                      <Download size={14} className="text-blue-400" />
                      <span>Exportação para o Anki</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Exporte os cards para o Anki em 1 clique com suporte a mnemônicos e tags.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: SELEÇÃO DE TÓPICOS & CONFIGURAÇÃO */}
            {step === "SELECT_TOPICS" && (
              <div className="space-y-6">
                {/* RESUMO DO DOCUMENTO HIGIENIZADO */}
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                        {pdfName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        <strong>{totalPages}</strong> páginas lidas •{" "}
                        <strong>{topics.length}</strong> tópicos detectados •{" "}
                        <span className="text-emerald-400 font-semibold">
                          ~{Math.round(totalCleanChars / 4)} tokens economizados
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Trocar PDF</span>
                  </button>
                </div>

                {/* SELETOR DE MODO: FLASHCARDS VS SIMULADO */}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOutputType("FLASHCARDS")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      outputType === "FLASHCARDS"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Zap size={14} />
                    <span>Gerar Flashcards (FSRS/Anki)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputType("QUIZ")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      outputType === "QUIZ"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>Extrair Simulado de Questões</span>
                  </button>
                </div>

                {/* OPÇÕES CONTEXTUAIS CONFORME O MODO ESCOLHIDO */}
                {outputType === "FLASHCARDS" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    {/* Baralho de Destino */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Layers size={13} className="text-indigo-400" />
                        <span>Baralho de Destino</span>
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setDeckMode("NEW")}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                            deckMode === "NEW"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Criar Novo
                        </button>
                        {decks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setDeckMode("EXISTING")}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                              deckMode === "EXISTING"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            Baralho Existente
                          </button>
                        )}
                      </div>

                      {deckMode === "NEW" ? (
                        <input
                          type="text"
                          value={newDeckTitle}
                          onChange={(e) => setNewDeckTitle(e.target.value)}
                          placeholder="Ex: Direito Administrativo - Atos"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <select
                          value={selectedDeckId}
                          onChange={(e) => setSelectedDeckId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {decks.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Modo Pedagógico */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sliders size={13} className="text-indigo-400" />
                        <span>Estilo Pedagógico</span>
                      </label>
                      <select
                        value={generationMode}
                        onChange={(e) => setGenerationMode(e.target.value as GenerationMode)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="CLOZE_AND_CONCEPTS">
                          ⚡ Conceitos & Lacunas (Cloze Deletion)
                        </option>
                        <option value="LAW_EXCEPTIONS">
                          ⚠️ Pegadinhas de Prova & Exceções Legais
                        </option>
                        <option value="DEADLINES_AND_NUMBERS">
                          ⏱️ Prazos, Quóruns & Números Críticos
                        </option>
                      </select>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">Cards por tópico:</span>
                        <div className="flex items-center gap-1">
                          {[5, 8, 10, 15].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setCardsPerTopic(val)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                                cardsPerTopic === val
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Banca Alvo</label>
                      <select
                        value={quizBanca}
                        onChange={(e) => setQuizBanca(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="Cebraspe">Cebraspe (Certo / Errado)</option>
                        <option value="FGV">FGV (Múltipla Escolha)</option>
                        <option value="FCC">FCC (Múltipla Escolha)</option>
                        <option value="Vunesp">Vunesp (Múltipla Escolha)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Dificuldade</label>
                      <select
                        value={quizDificuldade}
                        onChange={(e) => setQuizDificuldade(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="Fácil">Fácil (Fixação)</option>
                        <option value="Médio">Médio (Padrão de Prova)</option>
                        <option value="Difícil">Difícil (Pegadinhas Avançadas)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Qtd. de Questões</label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[3, 5, 8, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setQuizQuestionsCount(num)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                              quizQuestionsCount === num
                                ? "bg-violet-600 text-white"
                                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* LISTA DE TÓPICOS EXTRAÍDOS COM CHECKBOX */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Tópicos do PDF
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
                        {selectedTopicIds.size} de {topics.length} selecionados
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {selectedTopicIds.size === topics.length
                        ? "Desmarcar Todos"
                        : "Selecionar Todos"}
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {topics.map((topic) => {
                      const isSelected = selectedTopicIds.has(topic.id);
                      const isExpanded = expandedTopicId === topic.id;

                      return (
                        <div
                          key={topic.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-slate-950/70 border-indigo-500/40"
                              : "bg-slate-950/30 border-slate-800/80 opacity-60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start gap-3 cursor-pointer flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTopic(topic.id)}
                                className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold text-white leading-snug">
                                    {topic.title}
                                  </h4>
                                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                    {topic.pageRange}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-1">
                                  {topic.preview}
                                </p>
                              </div>
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTopicId(isExpanded ? null : topic.id)
                              }
                              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                              title="Ver prévia do texto"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                                <span>Texto higienizado ({topic.charCount} caracteres):</span>
                                <span>Estimativa: ~{topic.suggestedCardCount} flashcards</span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed text-slate-300">
                                {topic.cleanedText}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: GERANDO COM IA */}
            {step === "GENERATING" && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-200">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
                    <Sparkles size={36} className="animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-indigo-600 text-white">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-base font-black text-white">
                    {outputType === "FLASHCARDS"
                      ? "Gerando Flashcards de Alto Rendimento"
                      : "Construindo Simulado com IA"}
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">
                    Processando tópico {generatingProgress.current} de {generatingProgress.total}:
                  </p>
                  <p className="text-xs text-slate-400 italic truncate max-w-sm mx-auto">
                    &ldquo;{generatingProgress.currentTopicTitle}&rdquo;
                  </p>
                </div>

                <div className="w-full max-w-xs space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 rounded-full transition-all duration-300 shadow-sm shadow-indigo-500/50"
                      style={{
                        width: `${(generatingProgress.current / Math.max(1, generatingProgress.total)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      {Math.round(
                        (generatingProgress.current / Math.max(1, generatingProgress.total)) * 100
                      )}
                      %
                    </span>
                    <span>
                      {generatingProgress.current} de {generatingProgress.total} concluídos
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: SUCESSO */}
            {step === "SUCCESS" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {outputType === "FLASHCARDS"
                          ? `🎉 ${generatedCards.length} Flashcards Gerados com Sucesso!`
                          : `🎉 Simulado com ${finalQuizCount} Questões Gerado com Sucesso!`}
                      </h3>
                      <p className="text-xs text-emerald-300/80">
                        {outputType === "FLASHCARDS"
                          ? `Salvos no baralho ${finalDeckTitle} • Prontos para repetição espaçada.`
                          : `Salvo no seu banco de simulados com gabarito e orientações pedagógicas.`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer underline"
                  >
                    Importar Outro PDF
                  </button>
                </div>

                {/* BOTÕES DE AÇÃO RÁPIDA (ANKI & ÁUDIO PODCAST) */}
                {outputType === "FLASHCARDS" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAudioPlayerOpen(true)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Headphones size={15} className="text-indigo-400" />
                      <span>Ouvir em Áudio (Modo Podcast)</span>
                    </button>

                    {finalDeckId && (
                      <button
                        type="button"
                        onClick={() => setIsAnkiExportOpen(true)}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 border border-blue-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Download size={15} className="text-blue-400" />
                        <span>Exportar para o Anki (.txt)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* PREVIEW DOS CARDS GERADOS SE FOR FLASHCARDS */}
                {outputType === "FLASHCARDS" && generatedCards.length > 0 && (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {generatedCards.map((card, idx) => (
                      <div
                        key={card.id || idx}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                            Card #{idx + 1} • {card.topicTitle}
                          </span>
                          {card.details && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              Bizu / Pegadinha
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 font-medium leading-relaxed">
                          <strong>P:</strong> {card.question}
                        </p>
                        <p className="text-indigo-300 leading-relaxed pl-2 border-l-2 border-indigo-500/40">
                          <strong>R:</strong> {card.answer}
                        </p>
                        {card.details && (
                          <p className="text-[11px] text-slate-400 italic pt-0.5">
                            💡 {card.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RODAPÉ COM AÇÕES */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 shrink-0">
            {step === "UPLOAD" && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Privacidade total: o processamento de texto é feito em memória.</span>
              </div>
            )}

            {step === "SELECT_TOPICS" && (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={selectedTopicIds.size === 0}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>
                    {outputType === "FLASHCARDS"
                      ? `Gerar Cards (${selectedTopicIds.size * cardsPerTopic} estimados)`
                      : `Gerar Simulado (${quizQuestionsCount} questões)`}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}

            {step === "GENERATING" && (
              <div className="w-full text-center text-xs text-slate-400 font-medium">
                Aguarde a IA concluir a extração e estruturação do material...
              </div>
            )}

            {step === "SUCCESS" && (
              <div className="flex items-center justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Concluir
                </button>

                {outputType === "FLASHCARDS" && finalDeckId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/flashcards/study/${finalDeckId}`);
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
                  >
                    <Zap size={14} className="fill-white" />
                    <span>Praticar Baralho Agora</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {outputType === "QUIZ" && finalQuizId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/questions/${finalQuizId}`);
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/30 active:scale-95 cursor-pointer"
                  >
                    <BookOpen size={14} />
                    <span>Resolver Simulado Agora</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Modal de Exportação para o Anki */}
      {isAnkiExportOpen && finalDeckId && (
        <AnkiExportModal
          isOpen={isAnkiExportOpen}
          onClose={() => setIsAnkiExportOpen(false)}
          deckId={finalDeckId}
          deckTitle={finalDeckTitle}
        />
      )}

      {/* Modal Player de Estudo em Áudio (Podcast) */}
      {isAudioPlayerOpen && audioItems.length > 0 && (
        <AudioFlashcardPlayerModal
          isOpen={isAudioPlayerOpen}
          onClose={() => setIsAudioPlayerOpen(false)}
          cards={audioItems}
          deckTitle={finalDeckTitle || "Cards do PDF"}
        />
      )}
    </>
  );
}
