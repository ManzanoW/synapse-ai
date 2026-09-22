"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Split,
  FileText,
  Highlighter,
  Award,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { LineError } from "@/actions/essay-actions";

interface GoldenVersionSplitViewProps {
  originalText: string;
  goldenVersion: string;
  banca: string;
  score: number;
  maxScore: number;
  lineCount: number;
  wordCount: number;
  lineErrors?: LineError[];
  strengths?: string[];
}

// Termos técnicos, conectivos cultos e conceitos-chave para destaque
const KEY_TERMS_REGEX =
  /\b(não obstante|outrossim|por conseguinte|nesse prisma|em contrapartida|sob essa ótica|dessarte|ademais|infere-se|mormente|precipuamente|haja vista|alienígena|compliance|accountability|vendor lock-in|black box|xai|sandbox|due diligence|interoperabilidade|constituição|constitucional|supremo tribunal federal|stf|stj|jurisprudência|princípio|proporcionalidade|razoabilidade|dignidade da pessoa humana|legalidade|segurança jurídica|marco civil|lgpd|estado democrático de direito|isonomia)\b/gi;

export function GoldenVersionSplitView({
  originalText,
  goldenVersion,
  banca,
  score,
  maxScore,
  lineCount,
  wordCount,
  lineErrors = [],
  strengths = [],
}: GoldenVersionSplitViewProps) {
  const [viewMode, setViewMode] = useState<"split" | "golden-only">("split");
  const [mobileTab, setMobileTab] = useState<"original" | "golden">("golden");
  const [highlightKeywords, setHighlightKeywords] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Calcula estatísticas da versão Ouro
  const goldenLines = useMemo(() => {
    if (!goldenVersion) return [];
    return goldenVersion.trim().split("\n");
  }, [goldenVersion]);

  const goldenWordCount = useMemo(() => {
    const words = goldenVersion.trim().match(/\S+/g);
    return words ? words.length : 0;
  }, [goldenVersion]);

  const originalLines = useMemo(() => {
    if (!originalText) return [];
    return originalText.trim().split("\n");
  }, [originalText]);

  const handleCopy = () => {
    if (goldenVersion) {
      navigator.clipboard.writeText(goldenVersion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Função para renderizar texto destacando termos-chave e conectivos
  const renderTextWithHighlights = (text: string, isGolden: boolean = false) => {
    if (!highlightKeywords || !text) {
      return <span>{text}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = new RegExp(KEY_TERMS_REGEX.source, "gi");
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }
      const matchedTerm = match[0];
      parts.push(
        <mark
          key={`${matchIndex}-${matchedTerm}`}
          className={`px-1 py-0.5 rounded font-medium transition-colors ${
            isGolden
              ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
              : "bg-indigo-500/15 text-indigo-200 border border-indigo-500/20"
          }`}
        >
          {matchedTerm}
        </mark>
      );
      lastIndex = matchIndex + matchedTerm.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* BARRA SUPERIOR DE CONTROLE E SELEÇÃO DE MODO */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-xl">
        {/* Toggle Lado a Lado vs Somente Padrão Ouro */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Split size={14} />
            <span>Comparação Lado a Lado</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("golden-only")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "golden-only"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={14} />
            <span>Somente Padrão Ouro</span>
          </button>
        </div>

        {/* Switch Destacar Termos Técnicos + Botão Copiar */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightKeywords}
              onChange={(e) => setHighlightKeywords(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-violet-600 relative"></div>
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Highlighter size={13} className="text-violet-400" />
              <span>Destacar Termos Técnicos-Chave</span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Copiar texto da redação nota 100"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copiar Padrão Ouro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SELETOR MOBILE (Em telas menores que lg no modo split) */}
      {viewMode === "split" && (
        <div className="flex lg:hidden items-center justify-center p-1 bg-slate-900 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab("original")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileTab === "original"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-400"
            }`}
          >
            Sua Redação ({score.toFixed(1)} pts)
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("golden")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              mobileTab === "golden"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400"
            }`}
          >
            <Sparkles size={12} />
            <span>Padrão Ouro (100 pts)</span>
          </button>
        </div>
      )}

      {/* CONTAINER COMPARATIVO LADO A LADO */}
      <div
        className={`w-full ${
          viewMode === "split"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
            : "flex flex-col gap-6"
        }`}
      >
        {/* PAINEL ESQUERDO: SUA REDAÇÃO */}
        {viewMode === "split" && (
          <div
            className={`bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-4 ${
              mobileTab === "original" ? "block" : "hidden lg:flex"
            }`}
          >
            {/* Header do Painel Esquerdo */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-white/5">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Seu Texto Enviado
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {lineCount} linhas • {wordCount} palavras
                  </p>
                </div>
              </div>

              {/* Badge da Nota Obtida */}
              <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-mono font-bold text-slate-200">
                Nota: <span className="text-violet-400">{score.toFixed(1)}</span> / {maxScore}
              </div>
            </div>

            {/* Corpo do Texto do Aluno com Régua de Linhas */}
            <div className="bg-[#090d16] border border-white/5 rounded-xl p-4 sm:p-5 max-h-[750px] overflow-y-auto space-y-2 select-text">
              {originalLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-baseline group hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors"
                >
                  <span className="w-7 shrink-0 font-mono text-[11px] text-zinc-600 select-none text-right pr-2.5 border-r border-white/5">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0 font-serif text-[13.5px] sm:text-[14px] leading-[26px] text-slate-200 break-words whitespace-pre-wrap">
                    {renderTextWithHighlights(line, false)}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini-Resumo de Desvios Detectados */}
            {lineErrors.length > 0 && (
              <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-amber-400" />
                  <span>{lineErrors.length} {lineErrors.length === 1 ? "apontamento formal" : "apontamentos formais"} pela banca</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Consulte na aba "Parecer"</span>
              </div>
            )}
          </div>
        )}

        {/* PAINEL DIREITO: PADRÃO OURO NOTA 100 */}
        <div
          className={`bg-violet-950/10 border border-violet-500/25 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 ${
            viewMode === "split" && mobileTab !== "golden"
              ? "hidden lg:flex"
              : "flex"
          }`}
        >
          {/* Brilho neon de fundo */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Header do Painel Direito */}
          <div className="flex items-center justify-between border-b border-violet-500/20 pb-3.5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Sparkles size={16} className="text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Versão Padrão Ouro {banca}
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Gabaritada
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {goldenLines.length} linhas • {goldenWordCount} palavras
                </p>
              </div>
            </div>

            {/* Badge de Nota Máxima 100.0 */}
            <div className="px-3 py-1 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 border border-violet-400/40 text-xs font-mono font-black text-white shadow-lg shadow-violet-600/30 flex items-center gap-1">
              <Award size={13} className="text-amber-300" />
              <span>100.0 / 100</span>
            </div>
          </div>

          {/* Corpo do Texto Padrão Ouro com Régua de Linhas */}
          <div className="bg-[#0b0e1b] border border-violet-500/20 rounded-xl p-4 sm:p-5 max-h-[750px] overflow-y-auto space-y-2 relative z-10 select-text">
            {goldenLines.map((line, idx) => (
              <div
                key={idx}
                className="flex gap-3 items-baseline group hover:bg-violet-500/[0.04] rounded px-1 py-0.5 transition-colors"
              >
                <span className="w-7 shrink-0 font-mono text-[11px] text-violet-400/60 select-none text-right pr-2.5 border-r border-violet-500/15 font-semibold">
                  {(idx + 1).toString().padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0 font-serif text-[13.5px] sm:text-[14px] leading-[26px] text-slate-100 break-words whitespace-pre-wrap">
                  {renderTextWithHighlights(line, true)}
                </div>
              </div>
            ))}
          </div>

          {/* CARD EXPLICATIVO: DESTAQUES DESTA VERSÃO */}
          <div className="bg-slate-950/70 border border-violet-500/20 rounded-xl p-4 space-y-2.5 relative z-10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Destaques Técnicos Desta Versão (Padrão Nota 100)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span>Cobertura Integral</span>
                </span>
                <p className="text-slate-400 text-[10.5px] leading-relaxed">
                  Resposta direta e desdobrada para todos os tópicos do padrão com profundidade autônoma.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <Scale size={12} className="text-violet-400 shrink-0" />
                  <span>Repertório Nobre</span>
                </span>
                <p className="text-slate-400 text-[10.5px] leading-relaxed">
                  Uso legítimo de marcos normativos, doutrina e jargões técnicos consolidados sem clichês.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 space-y-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-400 shrink-0" />
                  <span>Coesão & Equilíbrio</span>
                </span>
                <p className="text-slate-400 text-[10.5px] leading-relaxed">
                  Operadores argumentativos interparágrafos maduros e precisão sintática irretocável.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
