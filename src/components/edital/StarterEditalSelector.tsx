"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  BookOpen,
  FileText,
  ShieldAlert,
  Wand2,
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
  onSuccess?: () => void;
  showCustomLink?: boolean;
  compact?: boolean;
}

export function StarterEditalSelector({
  onSuccess,
  showCustomLink = true,
  compact = false,
}: StarterEditalSelectorProps) {
  const router = useRouter();
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtro por categorias
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Modo de importação: mesclar ou substituir grade existente
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);

  // Personalização com IA
  const [customRoleInput, setCustomRoleInput] = useState<string>("");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);

  const handleSelectTemplate = async (templateId: string) => {
    setLoadingTemplateId(templateId);
    setErrorMessage(null);

    try {
      const res = await importStarterEditalAction(templateId, { replaceExisting });

      if (res.success && res.data) {
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
            onSuccess();
          }, 800);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 800);
        }
      } else {
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

    setIsGeneratingCustom(true);
    setErrorMessage(null);

    try {
      const res = await generateCustomEditalAction(trimmed, { replaceExisting });

      if (res.success && res.data) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setSuccessMessage(
          `Plano de estudos para "${res.data.targetRole}" gerado com IA! (${res.data.subjectsCount} disciplinas e ${res.data.topicsCount} tópicos criados)`
        );
        setCustomRoleInput("");

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          setTimeout(() => {
            router.refresh();
          }, 800);
        }
      } else {
        setErrorMessage(res.error || "Falha ao gerar disciplinas com IA.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro de conexão ao comunicar com a IA.");
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const allTemplates = Object.values(STARTER_EDITAL_TEMPLATES);
  const filteredTemplates = allTemplates.filter((tpl) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "ti") return tpl.category === "ti";
    if (activeCategory === "policial") return tpl.category === "policial";
    if (activeCategory === "fiscal_controle") return tpl.category === "fiscal_controle";
    if (activeCategory === "administrativo") return tpl.category === "administrativo";
    if (activeCategory === "juridica") return tpl.category === "juridica";
    if (activeCategory === "saude_educacao") return tpl.category === "saude_educacao";
    return true;
  });

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

      {/* CARD PROMINENTE: PERSONALIZAR MEU FOCO COM IA */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-linear-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Wand2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  Personalizar meu Foco com IA
                </span>
                <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Qualquer Concurso / Cargo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Digite o concurso ou cargo desejado e a IA pesquisa e estrutura as disciplinas e tópicos oficiais em segundos.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleGenerateCustom}
            className="flex items-center gap-2 w-full md:w-auto shrink-0"
          >
            <input
              type="text"
              value={customRoleInput}
              onChange={(e) => setCustomRoleInput(e.target.value)}
              placeholder="Ex: Analista de TI - Caixa, Perito Criminal..."
              className="flex-1 md:w-72 bg-slate-900/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isGeneratingCustom || !customRoleInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isGeneratingCustom ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Gerar com IA</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* OPÇÃO DE MODO DE CARGA: SUBSTITUIR OU ADICIONAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="font-medium text-[11px] sm:text-xs">
            Substituir matérias anteriores (limpar edital antes de carregar nova carreira)
          </span>
        </label>
        {replaceExisting && (
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-bold">
            ⚠️ Modo Substituição Limpa Ativado
          </span>
        )}
      </div>

      {/* FILTROS POR CATEGORIA DE CARREIRA */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: "all", label: `🔥 Todas (${allTemplates.length})` },
          { id: "ti", label: `💻 TI & Dados (${allTemplates.filter((t) => t.category === "ti").length})` },
          { id: "policial", label: `👮 Policial (${allTemplates.filter((t) => t.category === "policial").length})` },
          { id: "fiscal_controle", label: `💰 Fiscal & Controle (${allTemplates.filter((t) => t.category === "fiscal_controle").length})` },
          { id: "administrativo", label: `🏛️ Tribunais & Adm (${allTemplates.filter((t) => t.category === "administrativo").length})` },
          { id: "juridica", label: `⚖️ Jurídica (${allTemplates.filter((t) => t.category === "juridica").length})` },
          { id: "saude_educacao", label: `🩺 Saúde & Educação (${allTemplates.filter((t) => t.category === "saude_educacao").length})` },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* GRID DE CARREIRAS PRONTAS */}
      <div
        className={`grid gap-3 ${
          compact
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {filteredTemplates.map((tpl) => {
          const isLoading = loadingTemplateId === tpl.id;

          return (
            <div
              key={tpl.id}
              className="relative group p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tpl.icon}</span>
                    <span className="text-xs font-bold text-white leading-tight">
                      {tpl.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                    {tpl.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tpl.shortDescription}
                </p>

                {/* Resumo das Matérias */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tpl.materias.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  {tpl.materias.length} matérias mapeadas
                </span>

                <button
                  type="button"
                  disabled={loadingTemplateId !== null || isGeneratingCustom}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {showCustomLink && (
        <div className="pt-2 text-center">
          <a
            href="/edital"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors font-medium"
          >
            <FileText size={13} />
            <span>Já tem outro edital em PDF ou texto? Importe aqui com IA</span>
            <ArrowRight size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
