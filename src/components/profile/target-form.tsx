"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Calendar,
  Loader2,
  CheckCircle2,
  Sparkles,
  Briefcase,
  ChevronRight,
  Clock,
  Scale,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  isLawFocused,
  enableLawModuleInTargetRole,
  disableLawModule,
} from "@/lib/career-utils";

interface ProfileTargetFormProps {
  initialTargetDate?: Date | null;
  initialCareerFocus?: string | null;
  initialTargetRole?: string | null;
}

const CAREER_PRESETS = [
  { label: "💻 TI - Desenvolvimento de Software & Engenharia", value: "TI: Desenvolvimento de Software & Engenharia (BACEN, Caixa, BNDES, SERPRO)" },
  { label: "🧠 TI - Ciência de Dados, IA & Analytics", value: "TI: Ciência de Dados, IA & Analytics (BNDES, BACEN, Receita Federal TI)" },
  { label: "🛡️ TI - Redes, Cibersegurança & Nuvem", value: "TI: Redes, Cibersegurança & Nuvem (PF Perito TI, Tribunais, ABIN)" },
  { label: "💻 Tecnologia da Informação Geral", value: "Tecnologia da Informação & Dados (BACEN, Caixa TI, BNDES, CNU Bloco 2)" },
  { label: "👮 Carreiras Policiais (PF, PRF e PC)", value: "Carreiras Policiais (PF, PRF e PC)" },
  { label: "💰 Carreiras Fiscais & Auditoria", value: "Carreiras Fiscais & Auditoria (Receita Federal, SEFAZ e ISS)" },
  { label: "🏛️ Tribunais & Administrativo", value: "Tribunais & Administrativo (TJ, TRT, TRF, INSS e CNU)" },
  { label: "⚖️ Direito & Carreiras Jurídicas (Magistratura, MP, Delegado, OAB)", value: "Direito & Carreiras Jurídicas (Magistratura, MP, Delegado, Defensoria e OAB)" },
  { label: "🏦 Carreiras Bancárias & Financeiras", value: "Carreiras Bancárias & Financeiras (Caixa, BB e BACEN)" },
];

export default function ProfileTargetForm({
  initialTargetDate,
  initialCareerFocus,
  initialTargetRole,
}: ProfileTargetFormProps) {
  const router = useRouter();

  const formatDateForInput = (date?: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const [targetDate, setTargetDate] = useState<string>(
    formatDateForInput(initialTargetDate),
  );
  const [careerFocus, setCareerFocus] = useState<string>(
    initialCareerFocus || "Tecnologia da Informação & Dados",
  );
  const [targetRole, setTargetRole] = useState<string>(
    initialTargetRole || "Concurso Geral",
  );
  const [isCustomCareer, setIsCustomCareer] = useState<boolean>(
    !CAREER_PRESETS.some((p) => p.value === initialCareerFocus),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Calcula dias restantes se houver data definida
  const calculateDaysLeft = () => {
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = calculateDaysLeft();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSuccess(false);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetExamDate: targetDate ? targetDate : null,
          careerFocus: careerFocus.trim(),
          targetRole: targetRole.trim() || careerFocus.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar preferências.");
      }

      setSuccess(true);
      // Notifica componentes dinâmicos (como a sidebar) sobre a alteração de carreira
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("career-updated"));
      }
      router.refresh();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Erro na atualização:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const isLaw = isLawFocused(careerFocus, targetRole);

  const handleToggleLawModule = async () => {
    let nextCareer = careerFocus;
    let nextRole = targetRole;

    if (isLaw) {
      const res = disableLawModule(careerFocus, targetRole);
      nextCareer = res.careerFocus;
      nextRole = res.targetRole;
      setIsCustomCareer(!CAREER_PRESETS.some((p) => p.value === nextCareer));
    } else {
      nextRole = enableLawModuleInTargetRole(targetRole);
    }

    setCareerFocus(nextCareer);
    setTargetRole(nextRole);

    try {
      setIsSaving(true);
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetExamDate: targetDate ? targetDate : null,
          careerFocus: nextCareer.trim(),
          targetRole: nextRole.trim(),
        }),
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("career-updated"));
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao alternar módulo jurídico:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-[#090d16] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Foco do Concurso & Objetivo
            </h3>
            <p className="text-xs text-slate-400">
              Personalize sua carreira alvo para calibrar seus simulados, redações e edital.
            </p>
          </div>
        </div>

        <Link
          href="/edital"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Gerenciar Disciplinas no Edital</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SELEÇÃO DE CARREIRA */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Briefcase size={14} className="text-indigo-400" />
            <span>Carreira ou Foco Principal</span>
          </label>

          <select
            value={isCustomCareer ? "custom" : careerFocus}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") {
                setIsCustomCareer(true);
              } else {
                setIsCustomCareer(false);
                setCareerFocus(val);
                setTargetRole(val.split("(")[0].trim());
              }
            }}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {CAREER_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
            <option value="custom">✨ Outro / Personalizar Meu Próprio Cargo...</option>
          </select>

          {isCustomCareer && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-indigo-300 font-semibold block">
                Digite o cargo ou concurso específico:
              </span>
              <input
                type="text"
                value={careerFocus}
                onChange={(e) => {
                  setCareerFocus(e.target.value);
                  setTargetRole(e.target.value);
                }}
                placeholder="Ex: Analista de TI - Dataprev, Perito PF Computação Forense, etc."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-indigo-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
          )}
        </div>

        {/* DATA DA PROVA */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Calendar size={14} className="text-purple-400" />
            <span>Data Alvo da Prova</span>
          </label>

          <div className="relative">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors scheme-dark"
            />
          </div>

          {daysLeft !== null && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Clock size={13} className="text-amber-400 shrink-0" />
              {daysLeft > 0 ? (
                <span className="text-amber-300">
                  Faltam <strong className="text-white">{daysLeft} dias</strong> até a data da sua prova!
                </span>
              ) : daysLeft === 0 ? (
                <span className="text-emerald-400 font-bold">É hoje o grande dia! Boa prova! 🚀</span>
              ) : (
                <span className="text-slate-400">Data da prova já expirou. Atualize para o próximo alvo.</span>
              )}
            </div>
          )}
        </div>

        {/* MÓDULO DE DIREITO & CARREIRAS JURÍDICAS */}
        <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                isLaw
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-400"
              }`}
            >
              <Scale size={20} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Módulo de Direito (Jurisprudência & Prova Oral)
                </span>
                {isLaw ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={11} />
                    Ativo no Menu Lateral
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                    <EyeOff size={11} />
                    Oculto no Menu Lateral
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                {isLaw
                  ? "Recursos exclusivos de Jurisprudência (acórdãos do STF/STJ, súmulas e teses) e Simulador de Prova Oral com IA estão visíveis na barra lateral."
                  : "Os atalhos de Jurisprudência e Prova Oral ficam ocultos por padrão para concurseiros de TI, Bancário e Fiscal Geral, mantendo o menu limpo e focado."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleToggleLawModule}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border disabled:opacity-50 ${
              isLaw
                ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 hover:text-white"
                : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 hover:border-amber-500/50"
            }`}
          >
            {isLaw ? (
              <>
                <EyeOff size={14} />
                <span>Ocultar do Menu</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>Ativar Módulo no Menu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AÇÕES E MENSAGENS */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/60">
        <div>
          {success && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/25">
              <CheckCircle2 size={14} />
              <span>Objetivo e carreira atualizados com sucesso!</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Salvar Preferências</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
