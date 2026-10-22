"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ScrollText,
  Search,
  Sparkles,
  Eye,
  EyeOff,
  Lightbulb,
  Copy,
  Check,
  Zap,
  Sliders,
  BookOpen,
  Filter,
  Flame,
  Award,
  HelpCircle,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { LEI_SECA_ARTIGOS, ArtigoLeiSeca } from "@/lib/lei-seca-data";

type ClozeLevel = 1 | 2 | 3 | 4;

const RAMOS = [
  "Todos",
  "Constitucional",
  "Administrativo",
  "Penal",
  "Processo Penal",
  "Tributário",
] as const;

export function LeiSecaClient() {
  const [selectedRamo, setSelectedRamo] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [clozeLevel, setClozeLevel] = useState<ClozeLevel>(1);
  const [revealedTerms, setRevealedTerms] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  // Toggle revelação de um termo específico
  const toggleTerm = useCallback((termKey: string) => {
    triggerHaptic("medium");
    setRevealedTerms((prev) => {
      const nextState = !prev[termKey];
      if (nextState) {
        setRevealedCount((c) => {
          const nextCount = c + 1;
          if (nextCount > 0 && nextCount % 10 === 0) {
            triggerHaptic("heavy");
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.7 },
              });
            } catch {}
          }
          return nextCount;
        });
      }
      return { ...prev, [termKey]: nextState };
    });
  }, []);

  // Revela todas as lacunas do artigo
  const revealAllInArticle = useCallback((article: ArtigoLeiSeca) => {
    triggerHaptic("light");
    setRevealedTerms((prev) => {
      const updated = { ...prev };
      article.termosOcultaveis.forEach((t) => {
        const key = `${article.id}-${t.termo}`;
        updated[key] = true;
      });
      return updated;
    });
  }, []);

  // Oculta todas as lacunas do artigo
  const hideAllInArticle = useCallback((article: ArtigoLeiSeca) => {
    triggerHaptic("light");
    setRevealedTerms((prev) => {
      const updated = { ...prev };
      article.termosOcultaveis.forEach((t) => {
        const key = `${article.id}-${t.termo}`;
        delete updated[key];
      });
      return updated;
    });
  }, []);

  const handleCopy = useCallback((article: ArtigoLeiSeca) => {
    triggerHaptic("light");
    const fullText = `${article.siglaLei} - ${article.artigoNumero}\n${article.caput}\n${
      article.incisos ? article.incisos.join("\n") : ""
    }\n${article.paragrafos ? article.paragrafos.join("\n") : ""}\n\nPEGADINHA DA BANCA:\n${
      article.pegadinhaBanca
    }`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Filtragem dos artigos
  const filteredArticles = useMemo(() => {
    return LEI_SECA_ARTIGOS.filter((art) => {
      const matchesRamo = selectedRamo === "Todos" || art.ramo === selectedRamo;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.artigoNumero.toLowerCase().includes(q) ||
        art.lei.toLowerCase().includes(q) ||
        art.siglaLei.toLowerCase().includes(q) ||
        art.caput.toLowerCase().includes(q) ||
        art.pegadinhaBanca.toLowerCase().includes(q) ||
        (art.mnemonico && art.mnemonico.toLowerCase().includes(q));
      return matchesRamo && matchesSearch;
    });
  }, [selectedRamo, searchQuery]);

  // Função auxiliar para renderizar texto com lacunas clicáveis
  const renderInteractiveText = (text: string, article: ArtigoLeiSeca) => {
    // Filtra termos aplicáveis ao nível selecionado
    const activeTerms = article.termosOcultaveis.filter((t) => t.nivel <= clozeLevel);

    if (activeTerms.length === 0) return text;

    // Constrói regex com escape
    const escapedTerms = activeTerms
      .map((t) => t.termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);

    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const matchedTerm = activeTerms.find(
        (t) => t.termo.toLowerCase() === part.toLowerCase()
      );

      if (matchedTerm) {
        const key = `${article.id}-${matchedTerm.termo}`;
        const isRevealed = !!revealedTerms[key];

        return (
          <button
            key={index}
            type="button"
            onClick={() => toggleTerm(key)}
            className={`inline-flex items-center px-2 py-0.5 my-0.5 mx-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              isRevealed
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/50 hover:text-white hover:border-indigo-400 shadow-sm"
            }`}
            title={
              isRevealed
                ? "Toque para ocultar novamente"
                : matchedTerm.dica
                ? `Dica: ${matchedTerm.dica} (Toque para revelar)`
                : "Toque para revelar o termo"
            }
          >
            {isRevealed ? (
              part
            ) : (
              <span className="flex items-center gap-1 opacity-90">
                <span>[ ... ]</span>
                {matchedTerm.dica && (
                  <span className="text-[10px] text-amber-300 font-normal">
                    ({matchedTerm.dica})
                  </span>
                )}
              </span>
            )}
          </button>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-indigo-950/60 via-slate-900/80 to-[#070b14] border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-950/50">
            <ScrollText size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Lei Seca Interativa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase font-mono tracking-wider">
                Active Recall
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Elimine a leitura passiva. Tente recordar os prazos, quóruns e exceções literais antes de clicar na lacuna.
            </p>
          </div>
        </div>

        {/* CONTADOR DE LACUNAS REVELADAS / PONTUAÇÃO */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/10 shrink-0 relative z-10">
          <Zap size={16} className="text-amber-400 fill-amber-400/20" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              Lacunas Treinadas
            </span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {revealedCount} reveladas
            </span>
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DE OCULTAMENTO & FILTROS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-white/10 space-y-4">
        {/* Nível de Ocultamento das Lacunas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sliders size={15} className="text-indigo-400" />
            <span>Nível de Ocultamento das Lacunas:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { level: 1 as ClozeLevel, label: "25% (Prazos & Quóruns)", color: "text-emerald-400" },
              { level: 2 as ClozeLevel, label: "50% (Exceções)", color: "text-cyan-400" },
              { level: 3 as ClozeLevel, label: "75% (Verbos)", color: "text-amber-400" },
              { level: 4 as ClozeLevel, label: "100% (Hardcore)", color: "text-rose-400" },
            ].map((opt) => (
              <button
                key={opt.level}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setClozeLevel(opt.level);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  clozeLevel === opt.level
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                    : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Busca e Filtro de Ramos do Direito */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar por artigo, lei ou palavra-chave (ex: 'flagrante', 'posse', 'Art. 5º')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {RAMOS.map((ramo) => (
              <button
                key={ramo}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedRamo(ramo);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRamo === ramo
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-950 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {ramo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA DE ARTIGOS INTERATIVOS */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-900/30 border border-white/5 rounded-3xl">
            <BookOpen size={32} className="mx-auto text-slate-600" />
            <p className="text-sm font-bold text-slate-400">
              Nenhum artigo encontrado para o filtro selecionado.
            </p>
            <p className="text-xs text-slate-500">
              Tente buscar por termos genéricos como &quot;Art. 5&quot; ou altere o ramo do direito.
            </p>
          </div>
        ) : (
          filteredArticles.map((article) => {
            const isArticleCopied = copiedId === article.id;

            return (
              <div
                key={article.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#090d18] border border-white/10 hover:border-indigo-500/40 shadow-xl space-y-4 transition-all duration-200 relative group"
              >
                {/* TOPO DO ARTIGO */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-indigo-400">
                      {article.artigoNumero}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {article.siglaLei}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
                      {article.ramo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Revelar Todos */}
                    <button
                      type="button"
                      onClick={() => revealAllInArticle(article)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Revelar todas as lacunas deste artigo"
                    >
                      <Eye size={13} />
                      <span className="hidden sm:inline text-[11px]">Revelar</span>
                    </button>

                    {/* Botão Ocultar Todos */}
                    <button
                      type="button"
                      onClick={() => hideAllInArticle(article)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Ocultar lacunas"
                    >
                      <EyeOff size={13} />
                      <span className="hidden sm:inline text-[11px]">Ocultar</span>
                    </button>

                    {/* Botão Copiar */}
                    <button
                      type="button"
                      onClick={() => handleCopy(article)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Copiar texto do artigo com pegadinha"
                    >
                      {isArticleCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span className="hidden sm:inline text-[11px]">
                        {isArticleCopied ? "Copiado!" : "Copiar"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* CORPO DO ARTIGO COM LACUNAS INTERATIVAS */}
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <p className="font-normal">
                    {renderInteractiveText(article.caput, article)}
                  </p>

                  {article.incisos && article.incisos.length > 0 && (
                    <div className="space-y-1.5 pl-3 border-l-2 border-indigo-500/20">
                      {article.incisos.map((inciso, incIdx) => (
                        <p key={incIdx} className="text-slate-300">
                          {renderInteractiveText(inciso, article)}
                        </p>
                      ))}
                    </div>
                  )}

                  {article.paragrafos && article.paragrafos.length > 0 && (
                    <div className="space-y-1.5 pl-3 border-l-2 border-cyan-500/20">
                      {article.paragrafos.map((paragrafo, parIdx) => (
                        <p key={parIdx} className="text-slate-300">
                          {renderInteractiveText(paragrafo, article)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* CAIXA DE PEGADINHA DA BANCA & MNEMÔNICO */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase font-mono">
                      <Lightbulb size={13} className="text-amber-400" />
                      Pegadinha da Banca
                    </span>
                    <div className="flex items-center gap-1">
                      {article.bancasFrequentes.map((banca) => (
                        <span
                          key={banca}
                          className="px-1.5 py-0.2 rounded bg-amber-500/15 text-[9px] font-mono font-bold text-amber-200 border border-amber-500/30"
                        >
                          {banca}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-amber-200/90 leading-relaxed font-normal">
                    {article.pegadinhaBanca}
                  </p>

                  {article.mnemonico && (
                    <div className="pt-1 border-t border-amber-500/20 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                      <Sparkles size={12} className="text-amber-400 shrink-0" />
                      <span>Macete: {article.mnemonico}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
