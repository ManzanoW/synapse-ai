"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { triggerHaptic } from "@/lib/sensory/haptics";
import {
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  BookOpen,
  FileText,
  ShieldAlert,
  Wand2,
  ChevronLeft,
  Search,
} from "lucide-react";
import {
  STARTER_EDITAL_TEMPLATES,
  EditalTemplate,
} from "@/lib/edital-templates";
import {
  importStarterEditalAction,
  generateCustomEditalAction,
} from "@/actions/edital-templates-actions";

interface StarterEditalSelectorProps {
  onSuccess?: (data?: { subjectsCount?: number; topicsCount?: number }) => void;
  showCustomLink?: boolean;
  compact?: boolean;
}

interface MacroArea {
  id: string;
  name: string;
  icon: string;
  tag: string;
  badge: string;
  description: string;
  categoryFilter: (tpl: EditalTemplate) => boolean;
}

const MACRO_AREAS: MacroArea[] = [
  {
    id: "policial",
    name: "Carreira Policial",
    icon: "👮",
    tag: "PF, PRF, Polícias Civis e PM",
    badge: "Popular 🔥",
    description: "Direito Penal, Processo Penal, Constitucional, RLM e Legislação Especial.",
    categoryFilter: (t) => t.category === "policial",
  },
  {
    id: "juridica",
    name: "Tribunais & Jurídica",
    icon: "⚖️",
    tag: "TJ, TRT, TRE, TRF e Cartórios",
    badge: "Estável 🏛️",
    description: "Processo Civil, Processo do Trabalho, Eleitoral e Direito Público.",
    categoryFilter: (t) => t.category === "juridica",
  },
  {
    id: "fiscal_controle",
    name: "Fiscal & Controle",
    icon: "💰",
    tag: "Receita Federal, SEFAZ, TCU e TCE",
    badge: "Altos Salários 💎",
    description: "Direito Tributário, Auditoria, Contabilidade Geral e Pública.",
    categoryFilter: (t) => t.category === "fiscal_controle",
  },
  {
    id: "administrativo",
    name: "Administrativo & Bancário",
    icon: "🏛️",
    tag: "INSS, Banco do Brasil, Caixa e CNU",
    badge: "Muitas Vagas 🚀",
    description: "Atendimento bancário, Seguridade Social, Administração Pública e AFA.",
    categoryFilter: (t) =>
      t.category === "administrativo" || t.id === "bancario" || t.category === "geral",
  },
  {
    id: "ti",
    name: "Tecnologia & Dados",
    icon: "💻",
    tag: "TI Bancos, CNU Bloco 2, Dev e Dados",
    badge: "Em Alta ⚡",
    description: "Engenharia de Software, Bancos de Dados, Segurança e Inteligência Artificial.",
    categoryFilter: (t) => t.category === "ti",
  },
  {
    id: "saude_educacao",
    name: "Saúde & Educação",
    icon: "🩺",
    tag: "EBSERH, SUS, Enfermagem e Professores",
    badge: "Essencial 🌱",
    description: "Legislação do SUS, Enfermagem, Didática e Fundamentos da Educação.",
    categoryFilter: (t) => t.category === "saude_educacao",
  },
];

export function StarterEditalSelector({
  onSuccess,
  showCustomLink = true,
  compact = false,
}: StarterEditalSelectorProps) {
  const router = useRouter();
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Seleção Guiada em 2 Etapas: Nenhuma área selecionada no início (ou seleciona a primeira)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Modo de importação: mesclar ou substituir grade existente
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);

  // Personalização com IA
  const [customRoleInput, setCustomRoleInput] = useState<string>("");
  const [customDifficulty, setCustomDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);
  const [showAiCustomBox, setShowAiCustomBox] = useState<boolean>(false);

  const allTemplates = Object.values(STARTER_EDITAL_TEMPLATES);

  const activeArea = MACRO_AREAS.find((a) => a.id === selectedAreaId) || null;
  const filteredTemplates = activeArea
    ? allTemplates.filter(activeArea.categoryFilter)
    : [];

  const handleSelectTemplate = async (templateId: string) => {
    triggerHaptic("medium");
    setLoadingTemplateId(templateId);
    setErrorMessage(null);

    try {
      const res = await importStarterEditalAction(templateId, { replaceExisting });

      if (res.success && res.data) {
        triggerHaptic("heavy");
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });

        setSuccessMessage(
          `Edital de "${res.data.templateTitle}" ativado! (${res.data.subjectsCount} matérias e ${res.data.topicsCount} tópicos carregados)`
        );

        if (onSuccess) {
          setTimeout(() => {
            onSuccess({
              subjectsCount: res.data.subjectsCount,
              topicsCount: res.data.topicsCount,
            });
          }, 800);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 800);
        }
      } else {
        triggerHaptic("warning");
        setErrorMessage(res.error || "Ocorreu um erro ao carregar o edital.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro de conexão ao carregar modelo de edital.");
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;

    triggerHaptic("medium");
    setIsGeneratingCustom(true);
    setErrorMessage(null);

    try {
      const res = await generateCustomEditalAction(trimmed, {
        replaceExisting,
        difficultyLevel: customDifficulty,
      });

      if (res.success && res.data) {
        triggerHaptic("heavy");
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setSuccessMessage(
          `Plano de estudos para "${res.data.targetRole}" (${
            customDifficulty === "HARD"
              ? "🔥 Verticalizado Hardcore"
              : customDifficulty === "EASY"
              ? "🌱 Essencial"
              : "⚖️ Padrão"
          }) carregado${res.data.reusedFromSemanticCache ? " ⚡ da Base Inteligente" : " com IA"}! (${res.data.subjectsCount} disciplinas e ${res.data.topicsCount} tópicos)`
        );
        setCustomRoleInput("");

        if (onSuccess) {
          setTimeout(() => {
            onSuccess({
              subjectsCount: res.data.subjectsCount,
              topicsCount: res.data.topicsCount,
            });
          }, 800);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 800);
        }
      } else {
        triggerHaptic("warning");
        setErrorMessage(res.error || "Falha ao gerar disciplinas com IA.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro de conexão ao comunicar com a IA.");
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fade-in">
          <Check size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* =========================================================================
          ETAPA 1: ESCOLHA DA CARREIRA (6 CARDS VISUAIS - SEM CONGELAMENTO DE DECISÃO)
         ========================================================================= */}
      {!selectedAreaId ? (
        <div className="space-y-3.5">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
              Passo 1 de 2 • Escolha sua Área
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 tracking-tight">
              Qual carreira de concurso você deseja conquistar?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione sua área para ver os editais mais consagrados com pesos calibrados:
            </p>
          </div>

          {/* Grid de 6 Áreas Claras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MACRO_AREAS.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedAreaId(area.id);
                }}
                className="group relative p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-2xl">{area.icon}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 group-hover:text-indigo-300 group-hover:border-indigo-500/30">
                      {area.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {area.name}
                  </h4>
                  <p className="text-[11px] text-indigo-400/90 font-medium mt-0.5">
                    {area.tag}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {area.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 group-hover:text-white font-medium">
                  <span>Explorar editais</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1 text-indigo-400" />
                </div>
              </button>
            ))}
          </div>

          {/* Botão de Escape para Concurso Específico com IA */}
          <div className="pt-2">
            {!showAiCustomBox ? (
              <button
                type="button"
                onClick={() => setShowAiCustomBox(true)}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-xs font-semibold text-indigo-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wand2 size={15} className="text-indigo-400" />
                <span>Não encontrou seu concurso exato? Digite o cargo e a IA monta o edital em 3 segundos</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    Gerar Qualquer Concurso com Inteligência Artificial
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAiCustomBox(false)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Fechar
                  </button>
                </div>

                <form onSubmit={handleGenerateCustom} className="flex gap-2">
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="Ex: Auditor SEFAZ-SP, Analista IBAMA, Oficial PM..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={isGeneratingCustom || !customRoleInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isGeneratingCustom ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    <span>Gerar Edital</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================================
            ETAPA 2: EDITAIS PRONTOS DA ÁREA ESCOLHIDA (POUCAS OPÇÕES, DECISÃO RÁPIDA)
           ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Barra Superior de Retorno */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setSelectedAreaId(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer group"
            >
              <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Voltar para todas as áreas</span>
            </button>

            <span className="text-xs font-bold text-white flex items-center gap-2">
              <span className="text-lg">{activeArea?.icon}</span>
              <span>{activeArea?.name}</span>
            </span>
          </div>

          {/* Opção de Substituição Limpa */}
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-medium text-[11px] sm:text-xs">
                Substituir matérias anteriores (limpar grade antes de carregar nova carreira)
              </span>
            </label>
            {replaceExisting && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-bold">
                ⚠️ Modo Limpeza Ativo
              </span>
            )}
          </div>

          {/* Cards dos Editais Prontos */}
          <div
            className={`grid gap-3 ${
              compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {filteredTemplates.map((tpl) => {
              const isLoading = loadingTemplateId === tpl.id;
              const visibleMaterias = tpl.materias.slice(0, 4);
              const remainingCount = tpl.materias.length - visibleMaterias.length;

              return (
                <div
                  key={tpl.id}
                  className="relative p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{tpl.icon}</span>
                        <span className="text-sm font-bold text-white leading-tight truncate">
                          {tpl.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                        {tpl.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-snug">
                      {tpl.shortDescription}
                    </p>

                    {/* Matérias Principais */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {visibleMaterias.map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 truncate max-w-[150px]"
                        >
                          {m.name}
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                          +{remainingCount} matérias
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {tpl.materias.length} disciplinas mapeadas
                    </span>

                    <button
                      type="button"
                      disabled={loadingTemplateId !== null || isGeneratingCustom}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Ativando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Ativar em 1 Clique</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caixa de IA Específica para a Área */}
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-300">
              <span className="font-semibold text-white">Não é o edital que você procura?</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Digite o cargo exato da área {activeArea?.name} e a IA gera o conteúdo verticalizado:
              </p>
            </div>

            <form
              onSubmit={handleGenerateCustom}
              className="flex items-center gap-2 sm:w-auto w-full"
            >
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder={`Ex: Cargo em ${activeArea?.name}...`}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-full sm:w-60"
              />
              <button
                type="submit"
                disabled={isGeneratingCustom || !customRoleInput.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isGeneratingCustom ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Wand2 size={13} />
                )}
                <span>Gerar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {showCustomLink && (
        <div className="pt-2 text-center">
          <a
            href="/edital"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors font-medium"
          >
            <FileText size={13} />
            <span>Já tem o arquivo do seu edital em PDF? Importe com análise de IA aqui</span>
            <ArrowRight size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
