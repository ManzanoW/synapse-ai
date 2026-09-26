// src/app/(dashboard)/mapas-mentais/mapas-client.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Search,
  Zap,
  ArrowLeft,
  Loader2,
  Bookmark,
  Share2,
  Layers,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { MindmapViewer } from "@/components/mindmap/MindmapViewer";
import {
  generateMindmapAction,
  MindmapData,
} from "@/actions/mindmap-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

// Mapas Mentais Pré-compilados de Alta Incidência para Acesso Imediato
const PRESET_MINDMAPS: MindmapData[] = [
  {
    id: "mm-controle-const",
    title: "Controle de Constitucionalidade",
    subject: "Direito Constitucional",
    summary: "Diferenciação precisa entre o modelo difuso e concentrado, legitimação ativa e efeitos vinculantes.",
    createdAt: new Date().toISOString(),
    rootNode: {
      id: "root-cc",
      label: "Controle de Const.",
      description: "Mecanismo de verificação de conformidade das leis com a Constituição Federal.",
      color: "indigo",
      children: [
        {
          id: "br-difuso",
          label: "Controle Difuso",
          description: "Exercido por qualquer juiz ou tribunal no caso concreto (incidental).",
          color: "cyan",
          mnemonic: "DIFUSO = Qualquer Juiz no Caso Concreto",
          trapWarning: "Cuidado: efeitos inter partes, salvo modulação ou resolução do Senado.",
          children: [
            {
              id: "sub-res-senado",
              label: "Res. do Senado (Art. 52, X)",
              description: "Suspende a execução da lei declarada inconstitucional pelo STF.",
              mnemonic: "Senado suspende, não revoga!",
            },
            {
              id: "sub-clausula-reserva",
              label: "Cláusula de Reserva (Art. 97)",
              description: "Órgão especial ou plenário do tribunal deve decidir.",
              trapWarning: "SV 10: Violação se órgão fracionário afasta lei sem declarar expressamente.",
            },
          ],
        },
        {
          id: "br-concentrado",
          label: "Controle Concentrado",
          description: "Exercido pelo STF via ações autônomas do controle abstrato.",
          color: "emerald",
          mnemonic: "Ações: ADI, ADC, ADO, ADPF",
          children: [
            {
              id: "sub-legitimados",
              label: "Legitimados (Art. 103)",
              description: "4 mesas, 4 autoridades, 4 entidades.",
              mnemonic: "3 Mesas + 3 Autoridades + 3 Entidades (PGR, AGU, OAB, etc.)",
            },
            {
              id: "sub-efeitos",
              label: "Efeitos da Decisão",
              description: "Eficácia contra todos (erga omnes) e efeito vinculante.",
              trapWarning: "Vincula o Executivo e Judiciário, mas NÃO o Legislativo em sua função típica!",
            },
          ],
        },
        {
          id: "br-modulacao",
          label: "Modulação de Efeitos",
          description: "Segurança jurídica ou excepcional interesse social.",
          color: "amber",
          mnemonic: "Quórum: 2/3 dos ministros do STF",
          trapWarning: "Banca adora trocar: a regra é ex tunc (retroativo); a modulação é a exceção!",
        },
      ],
    },
  },
  {
    id: "mm-atos-admin",
    title: "Atos Administrativos",
    subject: "Direito Administrativo",
    summary: "Requisitos de validade, atributos do ato e distinção clássica entre revogação e anulação.",
    createdAt: new Date().toISOString(),
    rootNode: {
      id: "root-atos",
      label: "Atos Administrativos",
      description: "Manifestação unilateral de vontade da Administração Pública sob regime de direito público.",
      color: "indigo",
      children: [
        {
          id: "br-requisitos",
          label: "Requisitos de Validade",
          description: "Elementos constitutivos indispensáveis para a higidez do ato.",
          color: "emerald",
          mnemonic: "CO-FI-FO-MO-OB (Competência, Finalidade, Forma, Motivo, Objeto)",
          children: [
            {
              id: "sub-convalidacao",
              label: "Convalidação",
              description: "Admissível apenas para vícios sanáveis de Competência e Forma.",
              mnemonic: "Só convalida 'CO' e 'FO' se não for exclusivo nem solene!",
            },
          ],
        },
        {
          id: "br-atributos",
          label: "Atributos do Ato",
          description: "Prerrogativas de autoridade que diferenciam o ato público do ato privado.",
          color: "rose",
          mnemonic: "P-A-T-I (Presunção de Legitimidade, Autoexecutoriedade, Tipicidade, Imperatividade)",
          trapWarning: "Nem todo ato é autoexecutório! Ex: multas necessitam de execução fiscal judicial.",
        },
        {
          id: "br-extincao",
          label: "Anulação vs. Revogação",
          description: "Desfazimento do ato por ilegalidade ou por conveniência e oportunidade.",
          color: "amber",
          mnemonic: "Anulação = Ilegalidade (Ex Tunc) | Revogação = Mérito (Ex Nunc)",
          trapWarning: "Súmulas 346 e 473 STF: Administração pode anular os próprios atos pelo princípio da autotutela.",
        },
      ],
    },
  },
  {
    id: "mm-crimes-adm",
    title: "Crimes contra a Adm. Pública",
    subject: "Direito Penal",
    summary: "Principais tipos penais dos servidores: peculato, concussão, corrupção passiva e prevaricação.",
    createdAt: new Date().toISOString(),
    rootNode: {
      id: "root-penal",
      label: "Crimes contra a Adm.",
      description: "Capítulo I do Título XI do Código Penal (praticados por funcionário público).",
      color: "indigo",
      children: [
        {
          id: "br-peculato",
          label: "Peculato (Art. 312)",
          description: "Apropriação ou desvio de dinheiro ou bem móvel em razão do cargo.",
          color: "cyan",
          mnemonic: "Peculato Culposo: reparação do dano antes do trânsito em julgado extingue a punibilidade!",
        },
        {
          id: "br-concussao",
          label: "Concussão (Art. 316)",
          description: "EXIGIR, para si ou para outrem, vantagem indevida.",
          color: "rose",
          mnemonic: "Concussão = EXIGIR | Corrupção Passiva = SOLICITAR ou RECEBER",
          trapWarning: "Pegadinha clássica: trocar o verbo 'exigir' pelo 'solicitar'.",
        },
        {
          id: "br-prevaricacao",
          label: "Prevaricação (Art. 319)",
          description: "Retardar ou deixar de praticar ato para satisfazer interesse ou sentimento pessoal.",
          color: "amber",
          mnemonic: "Prevaricação = Interesse ou Sentimento PESSOAL (não há vantagem financeira!)",
        },
      ],
    },
  },
];

export function MapasMentaisClient() {
  const [activeMindmap, setActiveMindmap] = useState<MindmapData>(PRESET_MINDMAPS[0]);
  const [topicInput, setTopicInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("Direito Constitucional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const { playClick, playChime } = useSound();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    playClick();
    triggerHaptic("medium");

    try {
      const res = await generateMindmapAction({
        topic: topicInput.trim(),
        subject: subjectInput,
      });

      if (res.success && res.data) {
        setActiveMindmap(res.data);
        playChime();
        triggerHaptic("success");
      }
    } catch (err) {
      console.error("Erro ao gerar mapa mental:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = (mm: MindmapData) => {
    playClick();
    triggerHaptic("light");
    setActiveMindmap(mm);
  };

  const filteredPresets = PRESET_MINDMAPS.filter(
    (mm) =>
      mm.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      mm.subject.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-[#02050e] text-slate-900 dark:text-slate-100 p-3 sm:p-5 md:p-8 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
      {/* Luz Ambient Neon */}
      <div className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 right-10 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[130px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* NAVEGAÇÃO SUPERIOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Brain size={13} />
                <span>Síntese Cognitiva Visual</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Hub de Mapas Mentais & Mnemônicos
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esquematização vetorial com curvas de Bézier e macetes das principais bancas examinadoras
              </p>
            </div>
          </div>
        </div>

        {/* BARRA DE GERAÇÃO COM IA */}
        <form
          onSubmit={handleGenerate}
          className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#07090e]/90 border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Digite qualquer tema do seu edital (ex: Prisão Preventiva, Orçamento Público, Regras de Concordância...)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              className="py-3 px-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Direito Constitucional">Direito Constitucional</option>
              <option value="Direito Administrativo">Direito Administrativo</option>
              <option value="Direito Penal">Direito Penal</option>
              <option value="Direito Tributário">Direito Tributário</option>
              <option value="Língua Portuguesa">Língua Portuguesa</option>
              <option value="Raciocínio Lógico">Raciocínio Lógico</option>
              <option value="Administração Geral">Administração Geral</option>
            </select>

            <button
              type="submit"
              disabled={isGenerating || !topicInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sintetizando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Gerar Mapa Mental com IA</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* CATÁLOGO DE MAPAS DE ALTA INCIDÊNCIA */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 shrink-0 flex items-center gap-1.5 mr-1">
            <Bookmark size={13} className="text-indigo-500" />
            <span>Mais Cobrados:</span>
          </span>
          {filteredPresets.map((mm) => {
            const isCurrent = activeMindmap.id === mm.id;
            return (
              <button
                key={mm.id}
                type="button"
                onClick={() => handleSelectPreset(mm)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isCurrent
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                    : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
              >
                {mm.title}
              </button>
            );
          })}
        </div>

        {/* VISUALIZADOR INTERATIVO DO MAPA MENTAL SELECIONADO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeMindmap.title}</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {activeMindmap.subject}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeMindmap.summary}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Lightbulb size={13} className="text-amber-400" /> Macetes destacados
              </span>
            </div>
          </div>

          <MindmapViewer data={activeMindmap} />
        </div>
      </div>
    </div>
  );
}
