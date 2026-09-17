"use client";

import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  HelpCircle,
  FileText,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportDeckToAnkiAction, AnkiExportResult } from "@/actions/anki-export-actions";

interface AnkiExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckTitle?: string;
}

export function AnkiExportModal({
  isOpen,
  onClose,
  deckId,
  deckTitle,
}: AnkiExportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exportData, setExportData] = useState<AnkiExportResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega os dados quando o modal abre
  React.useEffect(() => {
    if (!isOpen || !deckId) return;

    let ignore = false;
    async function fetchExport() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await exportDeckToAnkiAction(deckId);
        if (!ignore) {
          if (res.success) {
            setExportData(res);
          } else {
            setErrorMessage(res.error || "Não foi possível gerar a exportação.");
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setErrorMessage(
            err instanceof Error ? err.message : "Erro ao exportar para o Anki."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchExport();
    return () => {
      ignore = true;
    };
  }, [isOpen, deckId]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!exportData?.content || !exportData.fileName) return;

    const blob = new Blob([exportData.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!exportData?.content) return;
    try {
      await navigator.clipboard.writeText(exportData.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (_) {
      setErrorMessage("Não foi possível copiar para a área de transferência.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Download size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Exportar para o Anki
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  OFICIAL .TXT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compatível com Anki Desktop (Windows/Mac), AnkiDroid e AnkiMobile
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
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={32} className="text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">
                Formatando flashcards e mnemônicos para a sintaxe do Anki...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          ) : exportData ? (
            <>
              {/* CARD DE RESUMO */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Baralho Selecionado
                  </span>
                  <h3 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                    {exportData.deckTitle || deckTitle}
                  </h3>
                  <p className="text-xs text-indigo-400 font-semibold">
                    {exportData.cardCount} {exportData.cardCount === 1 ? "card pronto" : "cards prontos"} para importação
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Layers size={22} />
                </div>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-95 cursor-pointer"
                >
                  <Download size={15} />
                  <span>Baixar Arquivo Anki (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-3 rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check size={15} className="text-emerald-400" />
                      <span className="text-emerald-300">Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      <span>Copiar para Área de Transf.</span>
                    </>
                  )}
                </button>
              </div>

              {/* TUTORIAL PASSO A PASSO */}
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                  <HelpCircle size={15} className="text-blue-400" />
                  <span>Como Importar no Anki em 3 Passos:</span>
                </div>

                <ol className="text-xs text-slate-300 space-y-2 pl-4 list-decimal leading-relaxed">
                  <li>
                    Abra o <strong>Anki</strong> no computador ou aplicativo móvel.
                  </li>
                  <li>
                    No menu superior, clique em <strong>Arquivo ➔ Importar</strong> (ou tecle <code>Ctrl+I</code>).
                  </li>
                  <li>
                    Selecione o arquivo baixado (<code>{exportData.fileName}</code>). O Anki já reconhecerá os separadores, formatação HTML e a tag <code>synapse-ai</code> automaticamente!
                  </li>
                </ol>

                <div className="pt-1 text-[11px] text-slate-400 border-t border-blue-500/20">
                  💡 <em>Os mnemônicos e bizús de banca aparecem destacados com estilo visual exclusivo no verso de cada card.</em>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* RODAPÉ */}
        <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
