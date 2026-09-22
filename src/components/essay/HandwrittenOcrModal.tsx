"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  ArrowRight,
  Eye,
  Check,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  transcribeHandwrittenEssayAction,
  TranscribeHandwrittenEssayResponse,
} from "@/actions/essay-actions";
import { sanitizeOcrTranscription } from "@/lib/essay-ocr-utils";

interface HandwrittenOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranscription: (transcribedText: string) => void;
}

export function HandwrittenOcrModal({
  isOpen,
  onClose,
  onApplyTranscription,
}: HandwrittenOcrModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [ocrData, setOcrData] = useState<TranscribeHandwrittenEssayResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("Enviando foto da folha...");

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const processImageFile = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Por favor, envie uma foto válida em JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("A imagem deve ter até 15MB.");
      return;
    }

    // Cria preview local da imagem
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    setErrorMessage(null);
    setStep("processing");
    setProcessingStatus("Digitalizando traçado caligráfico...");

    setTimeout(() => {
      setProcessingStatus("Identificando recuo de parágrafos e linhas 1 a 30...");
    }, 1500);

    setTimeout(() => {
      setProcessingStatus("Formatando pontuação e fidelidade textual...");
    }, 3000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await transcribeHandwrittenEssayAction(formData);

      if (res.success && res.transcription) {
        setOcrData(res);
        setTranscribedText(sanitizeOcrTranscription(res.transcription));
        setStep("review");
      } else {
        setErrorMessage(res.error || "Não foi possível transcrever a caligrafia da folha.");
        setStep("upload");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro inesperado ao processar a folha."
      );
      setStep("upload");
    }
  };

  const handleApply = () => {
    if (!transcribedText.trim()) return;
    onApplyTranscription(sanitizeOcrTranscription(transcribedText));
    onClose();
  };

  const handleReset = () => {
    setStep("upload");
    setImagePreview(null);
    setTranscribedText("");
    setOcrData(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  OCR de Redação Manuscrita
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  GEMINI VISION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tire foto da sua folha de prova em papel e preencha as 30 linhas automaticamente
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

        {/* CORPO */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
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
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-slate-700/80 hover:border-violet-500/60 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 bg-slate-950/40 hover:bg-violet-950/10"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 group-hover:scale-110 transition-transform">
                  <Camera size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Tire uma foto ou selecione a imagem da sua folha
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos JPG, PNG ou WEBP (até 15MB)
                  </p>
                </div>
              </div>

              {/* DICAS PARA UMA BOA CAPTURA */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <HelpCircle size={14} className="text-violet-400" />
                  <span>Dicas para a IA transcrever perfeitamente sua caligrafia:</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5 leading-relaxed">
                  <li>
                    Fotografe a folha de frente, bem iluminada e sem sombras pesadas.
                  </li>
                  <li>
                    Garanta que os números das linhas (1 a 30) e os parágrafos estejam visíveis.
                  </li>
                  <li>
                    Palavras rasuradas com traço simples horizontal serão desconsideradas automaticamente.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ETAPA 2: PROCESSANDO */}
          {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-xl shadow-violet-500/10">
                  <Camera size={36} className="animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-violet-600 text-white">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-white">
                  Lendo e Transcrevendo a Folha
                </h3>
                <p className="text-xs text-violet-300 font-medium">
                  {processingStatus}
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 3: REVISÃO E APROVAÇÃO */}
          {step === "review" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* STATUS DO OCR */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-violet-950/30 border border-violet-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Transcrição Concluída com Sucesso!
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      <strong>{ocrData?.detectedLines || 0}</strong> linhas identificadas • Legibilidade:{" "}
                      <strong className="text-emerald-400">{ocrData?.legibility || "Alta"}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Fotografar Outra</span>
                </button>
              </div>

              {/* EDITOR DA TRANSCRIÇÃO */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Revise o texto transcrito antes de preencher a folha:</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      transcribedText.trimEnd() &&
                      transcribedText.trimEnd().split("\n").length > 30
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {transcribedText.trimEnd()
                      ? transcribedText.trimEnd().split("\n").length
                      : 0}{" "}
                    / 30 linhas
                  </span>
                </div>

                <div className="relative rounded-2xl border border-slate-700/80 bg-slate-950 overflow-hidden">
                  <textarea
                    value={transcribedText}
                    onChange={(e) => setTranscribedText(e.target.value)}
                    rows={12}
                    className="w-full p-4 bg-transparent text-xs text-slate-100 focus:outline-none font-mono leading-relaxed resize-y selection:bg-violet-500/30"
                    placeholder="Texto da transcrição..."
                  />
                </div>
              </div>

              {ocrData?.observations && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                  <Sparkles size={14} className="text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Observação da IA:</strong> {ocrData.observations}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {step === "review" && (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/30 active:scale-95 cursor-pointer"
            >
              <Check size={15} />
              <span>Inserir na Folha Oficial (1 a 30 Linhas)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
