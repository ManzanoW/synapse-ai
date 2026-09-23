"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  Info,
  Camera,
  Printer,
  Crown,
  Gift,
} from "lucide-react";
import { EssayTheme } from "@/actions/essay-actions";
import { sanitizeOcrTranscription } from "@/lib/essay-ocr-utils";
import { SubmitConfirmationModal } from "./SubmitConfirmationModal";
import { ClearSheetModal } from "./ClearSheetModal";
import { HandwrittenOcrModal } from "./HandwrittenOcrModal";
import { PrintableExamSheetModal } from "./PrintableExamSheetModal";

interface ExamSheetEditorProps {
  theme: EssayTheme;
  initialContent?: string;
  onOpenMotivatingTexts: () => void;
  onSubmitEssay: (content: string, durationSeconds: number, lineCount: number, wordCount: number) => void;
  isEvaluating: boolean;
  quotaError?: string | null;
  onOpenQuotaModal?: () => void;
}

export function ExamSheetEditor({
  theme,
  initialContent = "",
  onOpenMotivatingTexts,
  onSubmitEssay,
  isEvaluating,
  quotaError = null,
  onOpenQuotaModal,
}: ExamSheetEditorProps) {

  const [content, setContent] = useState<string>(initialContent);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Carrega rascunho salvo no localStorage se houver
  useEffect(() => {
    if (!initialContent) {
      const savedDraft = localStorage.getItem(`essay_draft_${theme.title}`);
      if (savedDraft) {
        setContent(savedDraft);
        setHasSavedDraft(true);
      }
    }
  }, [theme.title, initialContent]);

  // Salva rascunho a cada alteração
  useEffect(() => {
    if (content) {
      localStorage.setItem(`essay_draft_${theme.title}`, content);
      setHasSavedDraft(true);
    }
  }, [content, theme.title]);

  // Cronômetro de prova
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Formatação do tempo: HH:MM:SS ou MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [seconds]);

  // Cálculo realista de linhas e palavras
  const lines = useMemo(() => {
    if (!content) return [];
    // Remove quebras vazias consecutivas acidentais no final (ex: \n\n\n\n)
    const sanitized = content.replace(/\r\n/g, "\n").replace(/\n{2,}$/, "\n");
    return sanitized.split("\n");
  }, [content]);

  const lineCount = useMemo(() => {
    if (!content.trim()) return 0;
    // Em folha oficial A4 de concurso com fonte serif 14.5px, uma linha comporta ~95-100 caracteres.
    // Quando o texto possui quebras explícitas (\n), cada quebra representa uma linha da folha pautada.
    // Apenas parágrafos contínuos muito longos (>100 caracteres sem \n) contam como múltiplas linhas físicas.
    let total = 0;
    const CHARS_PER_LINE = 100;
    for (const p of lines) {
      if (p.length === 0) {
        total += 1;
      } else {
        total += Math.max(1, Math.ceil(p.length / CHARS_PER_LINE));
      }
    }
    return Math.max(1, total);
  }, [content, lines]);

  const wordCount = useMemo(() => {
    const words = content.trim().match(/\S+/g);
    return words ? words.length : 0;
  }, [content]);

  // Status das linhas: mínimo 20, máximo 30
  const lineStatus = useMemo(() => {
    if (lineCount === 0) return { color: "text-slate-400", label: "0 / 30 linhas" };
    if (lineCount < 20) {
      return {
        color: "text-amber-400",
        label: `${lineCount} / 30 linhas (mínimo recomendado: 20)`,
        warning: "Abaixo do mínimo de 20 linhas exigido pela maioria das bancas.",
      };
    }
    if (lineCount <= 30) {
      return {
        color: "text-emerald-400",
        label: `${lineCount} / 30 linhas (conformidade com a banca)`,
      };
    }
    return {
      color: "text-rose-400",
      label: `${lineCount} / 30 linhas (limite ultrapassado)`,
      warning: "Linhas acima da 30ª serão desconsideradas pela banca examinadora!",
    };
  }, [lineCount]);

  const handleIndentParagraph = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const indent = "      "; // Recuo padrão de parágrafo (6 espaços)
    const newContent = content.substring(0, start) + indent + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indent.length;
        textareaRef.current.focus();
      }
    }, 10);
  };

  const handleConfirmClear = () => {
    setContent("");
    localStorage.removeItem(`essay_draft_${theme.title}`);
  };

  const handleOpenSubmitModal = () => {
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    onSubmitEssay(content, seconds, lineCount, wordCount);
  };

  return (
    <div
      className={`flex flex-col gap-4 w-full transition-all ${
        isFullscreen ? "fixed inset-0 z-50 bg-[#030611] p-4 sm:p-6 overflow-y-auto" : ""
      }`}
    >
      {/* BARRA SUPERIOR DE FERRAMENTAS E SIMULADO */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold font-mono">
            <Clock size={14} className="animate-pulse text-violet-400" />
            <span>{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isTimerRunning ? "Pausar" : "Retomar"}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-400">Status:</span>
            <span className={lineStatus.color}>{lineStatus.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Ver Textos Motivadores */}
          <button
            type="button"
            onClick={onOpenMotivatingTexts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            title="Abrir proposta e textos motivadores"
          >
            <BookOpen size={13} className="text-indigo-400" />
            <span>Proposta & Textos</span>
          </button>

          {/* Botão Foto do Manuscrito (OCR) */}
          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 text-violet-200 text-xs font-semibold border border-violet-500/30 hover:border-violet-400 transition-all cursor-pointer shadow-sm"
            title="Digitalizar foto da folha manuscrita com IA"
          >
            <Camera size={13} className="text-violet-400" />
            <span className="hidden sm:inline">Foto Manuscrito</span>
            <span className="sm:hidden">OCR</span>
          </button>

          {/* Botão Imprimir Folha A4 de Concurso */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 hover:border-violet-500/40 transition-all cursor-pointer shadow-sm"
            title="Imprimir folha oficial pautada A4 no formato de concurso (Cebraspe/FGV)"
          >
            <Printer size={13} className="text-violet-400" />
            <span className="hidden sm:inline">Imprimir Folha A4</span>
            <span className="sm:hidden">Imprimir</span>
          </button>

          {/* Botão Recuo de Parágrafo */}
          <button
            type="button"
            onClick={handleIndentParagraph}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            title="Inserir recuo de parágrafo oficial (6 espaços)"
          >
            <span>⇥ Parágrafo</span>
          </button>

          {/* Botão Limpar */}
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Limpar Folha"
          >
            <RotateCcw size={15} />
          </button>

          {/* Botão Tela Cheia */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? "Sair da Tela Cheia" : "Modo Foco em Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Botão Enviar para Banca */}
          <button
            type="button"
            onClick={handleOpenSubmitModal}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-violet-950/60 transition-all cursor-pointer active:scale-95 ml-2"
          >
            {isEvaluating ? (
              <>
                <Sparkles size={14} className="animate-spin" />
                <span>Examinando...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Enviar p/ Banca</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AVISO DE COTA ESGOTADA EM DESTAQUE */}
      {quotaError && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-amber-400 shrink-0" />
            <span>
              <strong>Cota diária de redação atingida (1/1).</strong> Seu rascunho de {lineCount} linhas está salvo!
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenQuotaModal && (
              <button
                type="button"
                onClick={onOpenQuotaModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
              >
                <Gift size={13} className="group-hover:scale-110 transition-transform" />
                <span>Desbloquear Cota (+1)</span>
              </button>
            )}
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Crown size={13} className="text-amber-300" />
              <span>Virar Pro</span>
            </Link>
          </div>
        </div>
      )}

      {/* AVISOS DE LINHA OU INSTRUÇÃO */}
      {lineStatus.warning && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium animate-in fade-in duration-150">
          <AlertTriangle size={15} className="shrink-0 text-amber-400" />
          <span>{lineStatus.warning}</span>
        </div>
      )}


      {/* CABEÇALHO DO TEMA E PADRÃO DE RESPOSTA */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
            <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
              Banca {theme.banca}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              Área {theme.subjectArea}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {wordCount} palavras • {lineCount} linhas
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
          {theme.title}
        </h2>

        {/* Tópicos esperados pela banca (se houver) */}
        {theme.expectedTopics && theme.expectedTopics.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">
              Aspectos que a banca exige abordar:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {theme.expectedTopics.map((top, idx) => (
                <div
                  key={idx}
                  className="text-[11px] text-slate-300 bg-white/5 border border-white/5 rounded-lg p-2.5 leading-relaxed break-words whitespace-normal"
                >
                  {top}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOLHA DE REDAÇÃO OFICIAL DIGITAL */}
      <div className="relative bg-[#0d121f] border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabeçalho Oficial da Folha */}
        <div className="bg-[#131b2e] border-b border-slate-700/80 p-3 sm:p-4 flex items-center justify-between text-center select-none">
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Folha de Texto Definitivo • Prova Discursiva
            </div>
            <div className="text-xs font-bold text-slate-200">
              {theme.banca} • Concurso Público
            </div>
          </div>

          <div className="hidden sm:block text-[10px] font-mono text-slate-400 border border-slate-600/40 rounded-lg px-2.5 py-1">
            Mín: 20 linhas | Máx: 30 linhas
          </div>

          <div className="text-right text-[10px] font-mono text-slate-400">
            {hasSavedDraft && <span className="text-emerald-400">✓ Rascunho salvo</span>}
          </div>
        </div>

        {/* ÁREA DE ESCRITA PAUTADA (1 A 30 LINHAS) */}
        <div className="relative flex bg-[#0d121f] min-h-[680px]">
          {/* Coluna Numérica da Margem Esquerda (Linhas 01 a 30) */}
          <div
            className="w-10 sm:w-12 bg-[#090d17] border-r border-slate-700/60 select-none py-3 flex flex-col items-center shrink-0 font-mono text-[12px] font-semibold text-slate-500"
            style={{ lineHeight: "34px" }}
          >
            {Array.from({ length: Math.max(30, lineCount) }).map((_, i) => {
              const lineNum = i + 1;
              const isActive = lineNum <= lineCount;
              const isOverLimit = lineNum > 30;

              return (
                <div
                  key={lineNum}
                  className={`h-[34px] flex items-center justify-center transition-colors ${
                    isOverLimit
                      ? "text-rose-500 font-bold"
                      : isActive
                      ? "text-indigo-400 font-bold"
                      : "text-slate-600"
                  }`}
                >
                  {lineNum.toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>

          {/* Área do Textarea com Linhas de Pauta em Background */}
          <div className="relative flex-1 p-0">
            {/* Pautas horizontais de fundo (linhas azuis sutis de caderno de concurso) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, transparent 33px, rgba(99, 102, 241, 0.12) 34px)",
                backgroundSize: "100% 34px",
                top: "12px",
              }}
            />

            {/* Linha vermelha vertical de margem direita (aviso visual da margem) */}
            <div className="absolute right-4 top-0 bottom-0 w-px bg-rose-500/10 pointer-events-none" />

            {/* Textarea oficial com quebra fluida */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inicie sua redação aqui. Use o botão '⇥ Parágrafo' ou pressione espaço para dar o recuo obrigatório de início de parágrafo..."
              rows={Math.max(30, lineCount)}
              className="relative w-full h-full bg-transparent text-slate-100 text-[14px] sm:text-[14.5px] font-serif leading-[34px] px-3 sm:px-4 py-3 resize-none focus:outline-hidden placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs z-10 break-words whitespace-pre-wrap overflow-x-hidden"
              style={{
                lineHeight: "34px",
                caretColor: "#818cf8",
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Rodapé da Folha Oficial */}
        <div className="bg-[#131b2e] border-t border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <span>
            Espaço para texto definitivo. Não assine nem coloque identificadores no corpo do texto.
          </span>
          <span className="font-mono text-slate-300">
            {wordCount} palavras • {lineCount} / 30 linhas
          </span>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE ENVIO PARA A BANCA */}
      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        banca={theme.banca}
        themeTitle={theme.title}
        lineCount={lineCount}
        wordCount={wordCount}
        formattedTime={formattedTime}
        isEvaluating={isEvaluating}
      />

      {/* MODAL DE CONFIRMAÇÃO PARA LIMPAR FOLHA */}
      <ClearSheetModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
      />

      {/* MODAL DE OCR DE FOLHA MANUSCRITA */}
      <HandwrittenOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyTranscription={(txt) => setContent(sanitizeOcrTranscription(txt))}
      />

      {/* MODAL DE IMPRESSÃO DE FOLHA OFICIAL A4 */}
      <PrintableExamSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        theme={theme}
      />
    </div>
  );
}
