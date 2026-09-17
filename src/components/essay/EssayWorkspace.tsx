"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  BookOpen,
  History,
  PenTool,
  RotateCcw,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  EssayTheme,
  EssayEvaluationResult,
  evaluateEssayAction,
} from "@/actions/essay-actions";
import { ExamSheetEditor } from "./ExamSheetEditor";
import { ThemeSelectorModal } from "./ThemeSelectorModal";
import { MotivatingTextsModal } from "./MotivatingTextsModal";
import { EssayResultView } from "./EssayResultView";
import { EssayHistoryList } from "./EssayHistoryList";

const DEFAULT_THEME: EssayTheme = {
  title: "Os Desafios da Segurança Pública e o Uso da Inteligência Artificial no Combate ao Crime Organizado",
  banca: "CEBRASPE",
  subjectArea: "Segurança Pública / Policial",
  motivatingTexts: [
    {
      title: "Texto I - A Transformação Digital na Investigação",
      source: "Ministério da Justiça e Segurança Pública (MJSP)",
      content:
        "O avanço de ferramentas analíticas, do reconhecimento facial e da integração de bancos de dados policiais tem possibilitado identificar padrões criminais e desarticular facções com velocidade sem precedentes. Contudo, impõe-se a necessidade de salvaguardas rigorosas para evitar vieses algorítmicos e violações à privacidade dos cidadãos.",
    },
    {
      title: "Texto II - Dados e Marco Legal",
      source: "Anuário Brasileiro de Segurança Pública / CF/88",
      content:
        "O artigo 144 da Constituição Federal define a segurança pública como dever do Estado, direito e responsabilidade de todos. O uso ético da tecnologia deve equilibrar a eficiência investigativa com as garantias fundamentais da presunção de inocência e do devido processo legal.",
    },
  ],
  expectedTopics: [
    "1. Papel das novas tecnologias e da IA na modernização das investigações policiais.",
    "2. Limites éticos e constitucionais quanto à privacidade e ao risco de discriminação.",
    "3. Ações integradas e estratégicas do Estado para garantir a segurança com respeito aos direitos humanos.",
  ],
  instructions: [
    "Redija texto dissertativo-argumentativo.",
    "Utilize caneta de tinta preta e letra legível.",
    "Mínimo 20 e máximo 30 linhas.",
  ],
};

export function EssayWorkspace() {
  const [viewMode, setViewMode] = useState<"write" | "result" | "history">("write");
  const [theme, setTheme] = useState<EssayTheme>(DEFAULT_THEME);
  const [evaluationResult, setEvaluationResult] = useState<EssayEvaluationResult | null>(null);

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isMotivatingModalOpen, setIsMotivatingModalOpen] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const handleSelectTheme = (newTheme: EssayTheme) => {
    setTheme(newTheme);
    setViewMode("write");
  };

  const handleSubmitEssay = async (
    content: string,
    durationSeconds: number,
    lineCount: number,
    wordCount: number,
  ) => {
    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const motivatingTextJoined = (theme.motivatingTexts || [])
        .map((t) => `${t.title}\n${t.content}`)
        .join("\n\n");

      const expectedPointsJoined = (theme.expectedTopics || []).join("\n");

      const res = await evaluateEssayAction({
        themeTitle: theme.title,
        banca: theme.banca,
        subjectArea: theme.subjectArea,
        motivatingText: motivatingTextJoined,
        expectedPoints: expectedPointsJoined,
        content,
        lineCount,
        wordCount,
        durationSeconds,
      });

      if (res.success && res.data) {
        setEvaluationResult(res.data);
        setViewMode("result");

        // Celebração se aprovado
        if (res.data.isApproved) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } else {
        setEvaluationError(
          res.error || "Ocorreu um erro ao submeter a redação para a banca examinadora.",
        );
      }
    } catch (err) {
      console.error(err);
      setEvaluationError("Falha de conexão com a banca avaliadora. Tente novamente.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectFromHistory = (essay: EssayEvaluationResult) => {
    setEvaluationResult(essay);
    setViewMode("result");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* SELETOR SUPERIOR DE ABAS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/50">
            <PenTool size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Analista de Redação</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-mono border border-violet-500/30">
                PADRÃO BANCA
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Prática em folha oficial de prova, temas quentes e correção honesta e rigorosa com IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "write" && (
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-950/50 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Mudar Tema / Banca</span>
            </button>
          )}

          <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "write"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PenTool size={13} />
              <span>Folha de Prova</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "history"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History size={13} />
              <span>Histórico</span>
            </button>
          </div>
        </div>
      </div>

      {/* MENSAGEM DE ERRO (SE HOUVER) */}
      {evaluationError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{evaluationError}</span>
        </div>
      )}

      {/* TELA 1: FOLHA DE REDAÇÃO */}
      {viewMode === "write" && (
        <ExamSheetEditor
          theme={theme}
          onOpenMotivatingTexts={() => setIsMotivatingModalOpen(true)}
          onSubmitEssay={handleSubmitEssay}
          isEvaluating={isEvaluating}
        />
      )}

      {/* TELA 2: RESULTADO & PARECER */}
      {viewMode === "result" && evaluationResult && (
        <EssayResultView
          result={evaluationResult}
          onNewEssay={() => {
            setViewMode("write");
            setIsThemeModalOpen(true);
          }}
          onViewHistory={() => setViewMode("history")}
        />
      )}

      {/* TELA 3: HISTÓRICO DE REDAÇÕES */}
      {viewMode === "history" && (
        <EssayHistoryList
          onSelectEssay={handleSelectFromHistory}
          onNewEssay={() => {
            setViewMode("write");
            setIsThemeModalOpen(true);
          }}
        />
      )}

      {/* MODAL DE SELEÇÃO DE TEMA */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onSelectTheme={handleSelectTheme}
      />

      {/* MODAL DE CONSULTA DE TEXTOS MOTIVADORES */}
      <MotivatingTextsModal
        isOpen={isMotivatingModalOpen}
        onClose={() => setIsMotivatingModalOpen(false)}
        theme={theme}
      />
    </div>
  );
}
