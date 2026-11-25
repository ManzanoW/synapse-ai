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

  // Diretório em 1 Etapa: Primeira área selecionada por padrão para exibir os editais reais de imediato
  const [selectedAreaId, setSelectedAreaId] = useState<string>("policial");

  // Modo de importação: mesclar ou substituir grade existente
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);

  // Personalização por cargo específico
  const [customRoleInput, setCustomRoleInput] = useState<string>("");
  const [customDifficulty, setCustomDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);

  const allTemplates = Object.values(STARTER_EDITAL_TEMPLATES);

  const activeArea = MACRO_AREAS.find((a) => a.id === selectedAreaId) || MACRO_AREAS[0];
  const filteredTemplates = allTemplates.filter(activeArea.categoryFilter);

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
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
          <ShieldAlert size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2 font-semibold animate-fade-in">
          <Check size={15} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
              Diretório de Grades Oficiais
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Selecione a carreira à esquerda para visualizar e carregar o conteúdo programático calibrado:
            </p>
          </div>
        </div>
      )}

      {/* DIRETÓRIO SPLIT-PANE AUTORAL COM IDENTIDADE VISUAL SYNAPSE AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda: Navegação Vertical de Carreiras */}
        <div className="lg:col-span-4 flex flex-col gap-1 p-2 rounded-xl bg-[#090d16] border border-slate-800/80 shadow-lg">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Áreas de Concurso
          </div>
          {MACRO_AREAS.map((area) => {
            const isSelected = area.id === activeArea.id;
            const count = allTemplates.filter(area.categoryFilter).length;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedAreaId(area.id);
                }}
                className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-500/15 text-white font-semibold border border-indigo-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent font-medium"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-indigo-400" />
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{area.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs block truncate">{area.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate font-normal">
                      {area.tag}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    isSelected
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Coluna Direita: Tabela Executiva de Editais da Área Selecionada */}
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded-xl border border-slate-800/80 bg-[#090d16] shadow-lg overflow-hidden">
            {/* Cabeçalho da Tabela */}
            <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {activeArea.icon}
                <span className="text-xs font-bold text-white">
                  {activeArea.name}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  — {activeArea.description}
                </span>
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Substituir grade atual</span>
              </label>
            </div>

            {/* Linhas de Editais */}
            <div className="divide-y divide-slate-800/70">
              {filteredTemplates.map((tpl) => {
                const isLoading = loadingTemplateId === tpl.id;
                const visibleMaterias = tpl.materias.slice(0, 5);
                const remainingCount = tpl.materias.length - visibleMaterias.length;

                return (
                  <div
                    key={tpl.id}
                    className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {tpl.title}
                        </h4>
                        <span className="text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {tpl.materias.length} disciplinas
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tpl.shortDescription}
                      </p>

                      {/* Lista Horizontal Limpa de Disciplinas */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {visibleMaterias.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-300 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded"
                          >
                            {m.name}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        disabled={loadingTemplateId !== null || isGeneratingCustom}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            <span>Carregando...</span>
                          </>
                        ) : (
                          <>
                            <span>Carregar Grade</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra Inline de Mapeamento Sob Demanda por Cargo */}
          <form
            onSubmit={handleGenerateCustom}
            className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
          >
            <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
              <Search size={14} className="text-indigo-400 shrink-0" />
              <span className="truncate">Outro cargo específico?</span>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-md">
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder={`Ex: Auditor SEFAZ-SP, Analista BACEN, Oficial...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
              <button
                type="submit"
                disabled={isGeneratingCustom || !customRoleInput.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isGeneratingCustom ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                <span>Mapear Cargo</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCustomLink && (
        <div className="pt-1 text-right">
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
