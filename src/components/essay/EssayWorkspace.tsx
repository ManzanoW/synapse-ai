"use client";

import React, { useState, useEffect } from "react";

import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Sparkles,
  BookOpen,
  History,
  PenTool,
  RotateCcw,
  FileText,
  AlertCircle,
  Award,
  Crown,
  Gift,
} from "lucide-react";
import {
  PageSpotlightBanner,
  SpotlightTriggerButton,
  useSpotlight,
} from "@/components/onboarding/PageSpotlightBanner";
import {
  EssayTheme,
  EssayEvaluationResult,
  evaluateEssayAction,
} from "@/actions/essay-actions";
import { triggerAiQuotaRefresh } from "@/lib/quota-events";
import { ExamSheetEditor } from "./ExamSheetEditor";
import { ThemeSelectorModal } from "./ThemeSelectorModal";
import { MotivatingTextsModal } from "./MotivatingTextsModal";
import { EssayResultView } from "./EssayResultView";
import { EssayHistoryList } from "./EssayHistoryList";
import { EssayQuotaModal } from "./EssayQuotaModal";


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
  const spotlight = useSpotlight("synapse_spotlight_redacao");
  const [viewMode, setViewMode] = useState<"write" | "result" | "history">("write");
  const [theme, setTheme] = useState<EssayTheme>(DEFAULT_THEME);
  const [evaluationResult, setEvaluationResult] = useState<EssayEvaluationResult | null>(null);

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isMotivatingModalOpen, setIsMotivatingModalOpen] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState<boolean>(false);
  const [submittedCounts, setSubmittedCounts] = useState<{ lines: number; words: number }>({
    lines: 0,
    words: 0,
  });


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
        triggerAiQuotaRefresh();
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
        triggerAiQuotaRefresh();
        setSubmittedCounts({ lines: lineCount, words: wordCount });
        const errMsg =
          res.error || "Ocorreu um erro ao submeter a redação para a banca examinadora.";
        setEvaluationError(errMsg);
        if (
          res.isQuotaExceeded ||
          errMsg.toLowerCase().includes("cota") ||
          errMsg.toLowerCase().includes("limite") ||
          errMsg.toLowerCase().includes("premium")
        ) {
          setIsQuotaModalOpen(true);
        }
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

  const isQuotaError = Boolean(
    evaluationError &&
      (evaluationError.toLowerCase().includes("cota") ||
        evaluationError.toLowerCase().includes("limite") ||
        evaluationError.toLowerCase().includes("premium") ||
        evaluationError.includes("429")),
  );


  return (
    <div className="flex flex-col gap-6 w-full">
      {/* SELETOR SUPERIOR DE ABAS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 dark:shadow-violet-950/50">
            <PenTool size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Analista de Redação</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30 text-[11px] font-mono font-bold">
                PADRÃO BANCA
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prática em folha oficial de prova, temas quentes e correção honesta e rigorosa com IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SpotlightTriggerButton
            accentColor="violet"
            onClick={spotlight.toggle}
            label="Como Funciona?"
          />

          {viewMode === "write" && (
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 dark:shadow-violet-950/50 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Mudar Tema / Banca</span>
            </button>
          )}

          <div className="flex rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-white/10 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("write")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "write"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-transparent dark:shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-transparent dark:shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <History size={13} />
              <span>Histórico</span>
            </button>
          </div>
        </div>
      </div>

      {/* DICA DE PRIMEIRO ACESSO: SPOTLIGHT REDAÇÃO */}
      <PageSpotlightBanner
        storageKey="synapse_spotlight_redacao"
        externalIsOpen={spotlight.isOpen}
        onClose={spotlight.dismiss}
        badgeText="✍️ Como Funciona o Treino Discursivo"
        title="Domine a Redação Nota Máxima com Feedback Real da Banca"
        description="Treine exatamente como no dia da sua prova: escolha a banca do concurso, redija na folha oficial ou envie foto do seu texto manuscrito para avaliação rigorosa da IA."
        accentColor="violet"
        primaryActionLabel="Entendi, vou praticar minha redação!"
        steps={[
          {
            icon: <FileText size={18} />,
            title: "1. Folha Oficial ou Foto Manuscrita",
            description:
              "Digite direto na régua de 30 linhas com alinhamento real de concurso ou envie foto da sua redação de próprio punho com leitura por OCR.",
            tag: "Folha Oficial",
          },
          {
            icon: <Award size={18} />,
            title: "2. Espelho de Correção da Banca",
            description:
              "A IA pontua Aspectos Macroestruturais (tema e argumentação) e Microestruturais (gramática e coesão) seguindo os critérios do seu edital.",
            tag: "Critérios Reais",
          },
          {
            icon: <Sparkles size={18} />,
            title: "3. Versão Ouro & Parecer Linha a Linha",
            description:
              "Veja em quais linhas você cometeu deslizes e receba uma reescrita nota máxima da sua redação para comparar e evoluir rápido.",
            tag: "Feedback Detalhado",
          },
        ]}
      />

      {/* MENSAGEM DE ERRO OU AVISO DE COTA */}
      {evaluationError && (
        isQuotaError ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-violet-500/15 border border-amber-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 mt-0.5 sm:mt-0">
                <Crown size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-200">
                    Cota Diária de Redação Atingida (1/1)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/25">
                    Rascunho Salvo
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  {evaluationError} Assista a um vídeo de 15s para desbloquear +1 correção bônus ou assine o Synapse Pro para correções ilimitadas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuotaModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all cursor-pointer group"
              >
                <Gift size={14} className="group-hover:scale-110 transition-transform" />
                <span>Assistir Vídeo (+1 Bônus)</span>
              </button>
              <Link
                href="/pricing"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-950/50 transition-all cursor-pointer group"
              >
                <Crown size={14} className="fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
                <span>Virar Pro</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{evaluationError}</span>
          </div>
        )
      )}

      {/* TELA 1: FOLHA DE REDAÇÃO */}
      {viewMode === "write" && (
        <ExamSheetEditor
          theme={theme}
          onOpenMotivatingTexts={() => setIsMotivatingModalOpen(true)}
          onSubmitEssay={handleSubmitEssay}
          isEvaluating={isEvaluating}
          quotaError={isQuotaError ? evaluationError : null}
          onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
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

      {/* MODAL DE COTA DE REDAÇÃO ESGOTADA */}
      <EssayQuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        lineCount={submittedCounts.lines}
        wordCount={submittedCounts.words}
        onRewardClaimed={() => {
          setEvaluationError(null);
        }}
      />
    </div>
  );
}
