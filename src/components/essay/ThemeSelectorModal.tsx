"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  BookOpen,
  Send,
  Layers,
  CheckCircle2,
  HelpCircle,
  FileEdit,
  ArrowRight,
} from "lucide-react";
import { EssayTheme, generateEssayThemeAction } from "@/actions/essay-actions";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (theme: EssayTheme) => void;
}

const BANCAS = [
  { id: "CEBRASPE", name: "Cebraspe / Cespe", desc: "Padrão discursivo clássico com tópicos obrigatórios" },
  { id: "FGV", name: "FGV", desc: "Exige profundo repertório e domínio sintático refinado" },
  { id: "FCC", name: "FCC", desc: "Temas filosóficos, sociológicos e reflexivos" },
  { id: "CESGRANRIO", name: "Cesgranrio", desc: "Clareza, atualidades e foco em políticas públicas" },
  { id: "VUNESP", name: "Vunesp", desc: "Dissertação com pergunta-tema e posicionamento claro" },
  { id: "GERAL", name: "Padrão Concursos", desc: "Estrutura equilibrada para qualquer concurso público" },
];

const AREAS = [
  { id: "Segurança Pública / Policial", label: "Policial / Segurança" },
  { id: "Tribunais e Ministério Público", label: "Tribunais / Jurídica" },
  { id: "Fiscal e Controle", label: "Fiscal / Controle" },
  { id: "Administrativa e Gestão", label: "Administrativa" },
  { id: "Tecnologia da Informação (TI)", label: "Tecnologia / TI" },
  { id: "Atualidades e Sociedade", label: "Atualidades Gerais" },
];

export function ThemeSelectorModal({
  isOpen,
  onClose,
  onSelectTheme,
}: ThemeSelectorModalProps) {
  const [selectedBanca, setSelectedBanca] = useState<string>("CEBRASPE");
  const [selectedArea, setSelectedArea] = useState<string>("Segurança Pública / Policial");
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTheme, setGeneratedTheme] = useState<EssayTheme | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");

  // Formulário manual
  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualText, setManualText] = useState<string>("");
  const [manualTopics, setManualTopics] = useState<string>("");

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedTheme(null);
    try {
      const res = await generateEssayThemeAction({
        banca: selectedBanca,
        subjectArea: selectedArea,
        customKeyword: customKeyword.trim() || undefined,
      });

      if (res.success && res.data) {
        setGeneratedTheme(res.data);
      } else {
        alert(res.error || "Erro ao gerar proposta com IA. Tente novamente.");
      }
    } catch (e) {
      console.error(e);
      alert("Falha de conexão ao gerar o tema.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmGenerated = () => {
    if (generatedTheme) {
      onSelectTheme(generatedTheme);
      onClose();
    }
  };

  const handleConfirmManual = () => {
    if (!manualTitle.trim()) {
      alert("Informe o título ou tema da redação.");
      return;
    }

    const topicsArray = manualTopics
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    const themeObj: EssayTheme = {
      title: manualTitle.trim(),
      banca: selectedBanca,
      subjectArea: selectedArea,
      motivatingTexts: manualText.trim()
        ? [
            {
              title: "Texto Motivador",
              content: manualText.trim(),
            },
          ]
        : [],
      expectedTopics:
        topicsArray.length > 0
          ? topicsArray
          : ["Abordagem do tema proposto com fundamentação consistente e conclusão propositiva."],
      instructions: [
        "O texto deve ser dissertativo-argumentativo.",
        "Mínimo 20 e máximo 30 linhas.",
      ],
    };

    onSelectTheme(themeObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-violet-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Escolher Tema de Redação
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere uma proposta quente de concurso com IA ou insira seu tema
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* SELETOR DE MODO (IA vs MANUAL) */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Sparkles size={14} />
              <span>Gerar Tema com IA (Recomendado)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "manual"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FileEdit size={14} />
              <span>Tema Próprio / Copiar Enunciado</span>
            </button>
          </div>

          {/* MODO 1: GERAR COM IA */}
          {activeTab === "ai" && (
            <div className="flex flex-col gap-4">
              {/* Seleção de Banca */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-2">
                  1. Escolha a Banca Examinadora:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BANCAS.map((banca) => (
                    <button
                      key={banca.id}
                      type="button"
                      onClick={() => setSelectedBanca(banca.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedBanca === banca.id
                          ? "bg-violet-50 border-violet-500 text-violet-950 shadow-md ring-1 ring-violet-500 dark:bg-violet-500/15 dark:border-violet-500 dark:text-white dark:ring-violet-400 dark:shadow-violet-950/40"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-800 dark:bg-slate-800/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="text-xs font-bold">{banca.name}</div>
                      <div className={`text-[10px] leading-tight mt-0.5 ${
                        selectedBanca === banca.id ? "text-violet-700 dark:text-slate-400" : "text-slate-500 dark:text-slate-400"
                      }`}>
                        {banca.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção de Área */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-2">
                  2. Área do Concurso:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AREAS.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => setSelectedArea(area.id)}
                      className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        selectedArea === area.id
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-400 font-bold dark:bg-indigo-500/20 dark:border-indigo-500 dark:text-indigo-200"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/60 dark:border-white/5 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assunto Específico (Opcional) */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1">
                  3. Assunto Específico (Opcional):
                </label>
                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="Ex: Inteligência Artificial na Investigação, Crimes Ambientais, Reforma Tributária..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              {/* Botão Gerar Proposta */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-violet-600/30 dark:shadow-violet-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {isGenerating ? (
                  <>
                    <Sparkles size={15} className="animate-spin" />
                    <span>Elaborando Proposta com a Banca {selectedBanca}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Gerar Proposta Inédita de Prova</span>
                  </>
                )}
              </button>

              {/* PRÉVIA DO TEMA GERADO */}
              {generatedTheme && (
                <div className="mt-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-violet-500/30 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider bg-violet-100 dark:bg-violet-500/10 px-2 py-0.5 rounded-md">
                      Proposta Oficial Gerada
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {generatedTheme.banca} • {generatedTheme.subjectArea}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {generatedTheme.title}
                  </h3>

                  {/* Textos motivadores resumidos */}
                  {generatedTheme.motivatingTexts && generatedTheme.motivatingTexts.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Textos Motivadores:</span>
                      {generatedTheme.motivatingTexts.map((txt, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] text-slate-700 dark:text-slate-300 shadow-2xs">
                          <div className="font-bold text-slate-900 dark:text-slate-200 mb-1">{txt.title}</div>
                          <p className="line-clamp-3 text-slate-600 dark:text-slate-400 leading-relaxed">{txt.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tópicos esperados */}
                  {generatedTheme.expectedTopics && generatedTheme.expectedTopics.length > 0 && (
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3">
                      <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block mb-1.5">
                        Tópicos Avaliados pela Banca:
                      </span>
                      <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                        {generatedTheme.expectedTopics.map((top, idx) => (
                          <li key={idx}>{top}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmGenerated}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <span>Ir para Folha de Redação</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODO 2: TEMA PRÓPRIO */}
          {activeTab === "manual" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1">
                  Título ou Tema da Redação: *
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ex: O papel das ouvidorias públicas na garantia da cidadania"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1">
                  Textos Motivadores / Enunciado (Opcional):
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={4}
                  placeholder="Cole aqui o texto motivador fornecido pela prova..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1">
                  Tópicos Obrigatórios (1 por linha, opcional):
                </label>
                <textarea
                  value={manualTopics}
                  onChange={(e) => setManualTopics(e.target.value)}
                  rows={3}
                  placeholder="1. Conceito e evolução histórica&#10;2. Principais desafios na gestão pública&#10;3. Medidas para ampliação do acesso"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleConfirmManual}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 dark:shadow-violet-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Usar este Tema e Abrir Folha</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
