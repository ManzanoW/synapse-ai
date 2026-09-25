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
  Lock,
  Crown,
  Film,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  transcribeHandwrittenEssayAction,
  TranscribeHandwrittenEssayResponse,
} from "@/actions/essay-actions";
import { sanitizeOcrTranscription } from "@/lib/essay-ocr-utils";
import { compressClientImage } from "@/lib/client-image-compression";
import { RewardedAdModal } from "@/components/quota/RewardedAdModal";
import Link from "next/link";

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

  const [step, setStep] = useState<"upload" | "processing" | "review" | "quota">("upload");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
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

    // Armazena o arquivo para permitir retry após anúncio premiado
    setCurrentFile(file);

    // Cria preview local da imagem
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    setErrorMessage(null);
    setStep("processing");
    setProcessingStatus("Otimizando imagem para leitura rápida...");

    try {
      // Comprime a foto no navegador antes do upload para economizar dados e acelerar a resposta da IA
      const optimizedFile = await compressClientImage(file, {
        maxDimension: 1800,
        quality: 0.85,
      });

      setProcessingStatus("Digitalizando traçado caligráfico...");

      const statusTimer1 = setTimeout(() => {
        setProcessingStatus("Identificando recuo de parágrafos e linhas 1 a 30...");
      }, 1500);

      const statusTimer2 = setTimeout(() => {
        setProcessingStatus("Formatando pontuação e fidelidade textual...");
      }, 3000);

      const formData = new FormData();
      formData.append("file", optimizedFile);

      const res = await transcribeHandwrittenEssayAction(formData);

      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);

      if (res.isQuotaExceeded) {
        setStep("quota");
        setErrorMessage(null);
        return;
      }

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
    setCurrentFile(null);
    setTranscribedText("");
    setOcrData(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRewardClaimed = () => {
    setShowAdModal(false);
    if (currentFile) {
      processImageFile(currentFile);
    } else {
      setStep("upload");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/20 dark:border-violet-500/30">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  OCR de Redação Manuscrita
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 dark:border-violet-500/30">
                  GEMINI VISION
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tire foto da sua folha de prova em papel e preencha as 30 linhas automaticamente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 cursor-pointer"
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
                className="relative border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-violet-500/60 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 bg-slate-50/60 hover:bg-violet-50/50 dark:bg-slate-950/40 dark:hover:bg-violet-950/10"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                  <Camera size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tire uma foto ou selecione a imagem da sua folha
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formatos JPG, PNG ou WEBP (até 15MB)
                  </p>
                </div>
              </div>

              {/* DICAS PARA UMA BOA CAPTURA */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <HelpCircle size={14} className="text-violet-600 dark:text-violet-400" />
                  <span>Dicas para a IA transcrever perfeitamente sua caligrafia:</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5 leading-relaxed">
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
                <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-xl shadow-violet-500/10">
                  <Camera size={36} className="animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-violet-600 text-white">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lendo e Transcrevendo a Folha
                </h3>
                <p className="text-xs text-violet-600 dark:text-violet-300 font-medium">
                  {processingStatus}
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 3: REVISÃO E APROVAÇÃO */}
          {step === "review" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* STATUS DO OCR */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Transcrição Concluída com Sucesso!
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      <strong>{ocrData?.detectedLines || 0}</strong> linhas identificadas • Legibilidade:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">{ocrData?.legibility || "Alta"}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Fotografar Outra</span>
                </button>
              </div>

              {/* EDITOR DA TRANSCRIÇÃO */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>Revise o texto transcrito antes de preencher a folha:</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      transcribedText.trimEnd() &&
                      transcribedText.trimEnd().split("\n").length > 30
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {transcribedText.trimEnd()
                      ? transcribedText.trimEnd().split("\n").length
                      : 0}{" "}
                    / 30 linhas
                  </span>
                </div>

                <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                  <textarea
                    value={transcribedText}
                    onChange={(e) => setTranscribedText(e.target.value)}
                    rows={12}
                    className="w-full p-4 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-mono leading-relaxed resize-y selection:bg-violet-500/30"
                    placeholder="Texto da transcrição..."
                  />
                </div>
              </div>

              {ocrData?.observations && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <Sparkles size={14} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Observação da IA:</strong> {ocrData.observations}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 4: LIMITE DE COTA ATINGIDO (PAYWALL AMIGÁVEL) */}
          {step === "quota" && (
            <div className="py-6 px-2 flex flex-col items-center text-center space-y-5 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-xl shadow-amber-500/10">
                  <Lock size={30} />
                </div>
                <div className="absolute -top-1 -right-1 p-1 rounded-lg bg-amber-500 text-slate-950 font-bold">
                  <Crown size={12} />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Limite Semanal Atingido (1/1)
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Você atingiu o teste gratuito semanal de OCR
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  A transcrição de folha manuscrita com IA Vision consome processamento de alta precisão.
                  Sua foto continua carregada! Escolha como deseja continuar:
                </p>
              </div>

              {imagePreview && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 max-w-sm w-full">
                  <img
                    src={imagePreview}
                    alt="Folha enviada"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shrink-0"
                  />
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Foto Salva e Pronta</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Não precisará enviar novamente
                    </p>
                  </div>
                </div>
              )}

              <div className="w-full max-w-sm space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdModal(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer group"
                >
                  <Film size={16} className="text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Assistir Vídeo Curto (+1 Leitura Grátis)</span>
                </button>

                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Crown size={15} />
                  <span>Desbloquear OCR Ilimitado com Synapse Pro</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={step === "quota" ? handleReset : onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {step === "quota" ? "Voltar ao Início" : "Cancelar"}
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

      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardClaimed={handleRewardClaimed}
        feature="OCR_ESSAY"
      />
    </div>
  );
}
