"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { triggerHaptic } from "@/lib/sensory/haptics";
import {
  Loader2,
  Check,
  ArrowRight,
  BookOpen,
  FileText,
  ShieldAlert,
  ChevronLeft,
  Search,
  Shield,
  Scale,
  Landmark,
  Building2,
  Terminal,
  Stethoscope,
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
  hideHeader?: boolean;
}

interface MacroArea {
  id: string;
  name: string;
  icon: React.ReactNode;
  tag: string;
  badge: string;
  description: string;
  categoryFilter: (tpl: EditalTemplate) => boolean;
}

const MACRO_AREAS: MacroArea[] = [
  {
    id: "policial",
    name: "Carreira Policial",
    icon: <Shield size={16} className="text-indigo-400" />,
    tag: "PF, PRF, Polícias Civis e PM",
    badge: "Alta Demanda",
    description: "Direito Penal, Processo Penal, Constitucional, RLM e Legislação Especial.",
    categoryFilter: (t) => t.category === "policial",
  },
  {
    id: "juridica",
    name: "Tribunais & Jurídica",
    icon: <Scale size={16} className="text-cyan-400" />,
    tag: "TJ, TRT, TRE, TRF e Cartórios",
    badge: "Carreira de Estado",
    description: "Processo Civil, Processo do Trabalho, Eleitoral e Direito Público.",
    categoryFilter: (t) => t.category === "juridica",
  },
  {
    id: "fiscal_controle",
    name: "Fiscal & Controle",
    icon: <Landmark size={16} className="text-emerald-400" />,
    tag: "Receita Federal, SEFAZ, TCU e TCE",
    badge: "Remuneração Topo",
    description: "Direito Tributário, Auditoria, Contabilidade Geral e Pública.",
    categoryFilter: (t) => t.category === "fiscal_controle",
  },
  {
    id: "administrativo",
    name: "Administrativo & Bancário",
    icon: <Building2 size={16} className="text-amber-400" />,
    tag: "INSS, Banco do Brasil, Caixa e CNU",
    badge: "Ampla Concorrência",
    description: "Atendimento bancário, Seguridade Social, Administração Pública e AFA.",
    categoryFilter: (t) =>
      t.category === "administrativo" || t.id === "bancario" || t.category === "geral",
  },
  {
    id: "ti",
    name: "Tecnologia & Dados",
    icon: <Terminal size={16} className="text-indigo-400" />,
    tag: "TI Bancos, CNU Bloco 2, Dev e Dados",
    badge: "Editais Abertos",
    description: "Engenharia de Software, Bancos de Dados, Segurança e Ciência de Dados.",
    categoryFilter: (t) => t.category === "ti",
  },
  {
    id: "saude_educacao",
    name: "Saúde & Educação",
    icon: <Stethoscope size={16} className="text-cyan-400" />,
    tag: "EBSERH, SUS, Enfermagem e Professores",
    badge: "Quadros Técnicos",
    description: "Legislação do SUS, Enfermagem, Didática e Fundamentos da Educação.",
    categoryFilter: (t) => t.category === "saude_educacao",
  },
];

export function StarterEditalSelector({
  onSuccess,
  showCustomLink = true,
  compact = false,
  hideHeader = false,
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

        // Dispara evento global de sincronização para atualizar Week, Edital e Dashboard
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("synapse-edital-updated", { detail: res.data })
          );
        }

        if (onSuccess) {
          setTimeout(() => {
            onSuccess({
              subjectsCount: res.data.subjectsCount,
              topicsCount: res.data.topicsCount,
            });
          }, 500);
        } else {
          setTimeout(() => {
            router.refresh();
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }, 700);
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

        // Dispara evento global de sincronização para atualizar Week, Edital e Dashboard
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("synapse-edital-updated", { detail: res.data })
          );
        }

        if (onSuccess) {
          setTimeout(() => {
            onSuccess({
              subjectsCount: res.data.subjectsCount,
              topicsCount: res.data.topicsCount,
            });
          }, 500);
        } else {
          setTimeout(() => {
            router.refresh();
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }, 700);
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
          {!hideHeader && (
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-300 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80">
                Catálogo de Carreiras Oficiais
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 tracking-tight">
                Selecione sua área de concurso
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Grades curriculares padronizadas com pesos calibrados conforme os últimos editais:
              </p>
            </div>
          )}

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
                className="group relative p-4 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-900/90 hover:border-slate-700 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {area.icon}
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-slate-300">
                      {area.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                    {area.name}
                  </h4>
                  <p className="text-[11px] text-indigo-400 font-medium mt-0.5">
                    {area.tag}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {area.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-white font-medium">
                  <span>Ver editais da área</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1 text-indigo-400" />
                </div>
              </button>
            ))}
          </div>

          {/* Botão de Escape para Concurso Específico */}
          <div className="pt-1">
            {!showAiCustomBox ? (
              <button
                type="button"
                onClick={() => setShowAiCustomBox(true)}
                className="w-full py-2.5 px-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-600 text-xs font-medium text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={14} className="text-indigo-400" />
                <span>Não encontrou seu concurso específico? Pesquise o cargo ou órgão para mapeamento automático</span>
              </button>
            ) : (
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <BookOpen size={14} className="text-indigo-400" />
                    Mapeamento Automático por Cargo ou Órgão
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
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={isGeneratingCustom || !customRoleInput.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isGeneratingCustom ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Mapear Edital</span>
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
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
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
              {activeArea?.icon}
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
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                Modo Limpeza Ativo
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
                  className="relative p-4 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-900/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-white leading-tight truncate">
                          {tpl.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
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
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 truncate max-w-[150px]"
                        >
                          {m.name}
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          +{remainingCount} matérias
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {tpl.materias.length} disciplinas mapeadas
                    </span>

                    <button
                      type="button"
                      disabled={loadingTemplateId !== null || isGeneratingCustom}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Carregando...</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          <span>Carregar Grade Oficial</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caixa Específica para a Área */}
          <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-300">
              <span className="font-semibold text-white">Não é o edital que você procura?</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Informe o cargo ou órgão de {activeArea?.name} para estruturar o conteúdo programático:
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
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-full sm:w-60"
              />
              <button
                type="submit"
                disabled={isGeneratingCustom || !customRoleInput.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isGeneratingCustom ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                <span>Mapear</span>
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
            <span>Já possui o PDF do edital oficial? Importar documento</span>
            <ArrowRight size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
