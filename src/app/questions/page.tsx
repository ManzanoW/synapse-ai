"use client";

import React, { useState } from "react";
import { useSidebar } from "@/lib/sidebar-context";
import {
  Menu,
  HelpCircle,
  Plus,
  Sparkles,
  X,
  Loader2,
  Target,
  BookOpen,
} from "lucide-react";

export default function QuestoesPage() {
  const { openSidebar } = useSidebar();

  // ================= ESTADOS GERAIS DA PÁGINA =================
  const [questions, setQuestions] = useState([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ================= ESTADOS DO MODAL IA PREMIUM =================
  const [banca, setBanca] = useState("Cebraspe");
  const [materia, setMateria] = useState("Português");
  const [qtdQuestoes, setQtdQuestoes] = useState("5");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">(
    "banca",
  );
  const [dificuldade, setDificuldade] = useState("Média");
  const [textoBase, setTextoBase] = useState("");

  // ================= ESTADOS DO MODAL MANUAL =================
  const [tipoFormato, setTipoFormato] = useState<"multipla" | "certo_errado">(
    "multipla",
  );
  const [alternativas, setAlternativas] = useState([
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ]);
  const [alternativaCorreta, setAlternativaCorreta] = useState("A");

  // ================= FUNÇÕES DO MODAL MANUAL =================
  const handleAddAlternativa = () => {
    if (alternativas.length >= 5) return;
    const proximaLetra = String.fromCharCode(65 + alternativas.length);
    setAlternativas([...alternativas, { id: proximaLetra, text: "" }]);
  };

  const handleRemoveAlternativa = () => {
    if (alternativas.length <= 2) return;
    setAlternativas(alternativas.slice(0, -1));
  };

  // ================= FUNÇÃO DISPARADORA DA IA =================
  const handleGenerateSimulado = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    // Payload completo preparado para a API
    const payload = {
      banca,
      materia,
      qtdQuestoes,
      fonteConteudo,
      dificuldade,
      textoBase: fonteConteudo === "texto" ? textoBase : "",
    };

    setTimeout(() => {
      setIsGenerating(false);
      setIsAIModalOpen(false);
      alert(
        `Synapse AI configurada!\n\n` +
          `• Banca: ${payload.banca}\n` +
          `• Matéria: ${payload.materia}\n` +
          `• Quantidade: ${payload.qtdQuestoes} Itens\n` +
          `• Origem: ${payload.fonteConteudo}\n` +
          `• Dificuldade: ${payload.dificuldade}`,
      );
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between border-b border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="p-2 bg-[#090d16] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 md:hidden transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <HelpCircle size={24} className="text-indigo-400" />
                Questões & Simulados
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
                Nossa IA gera questões e simulados personalizados pra você! Ela
                analisa o estilo da sua prova e cria questões parecidas,
                antecipando o cenário real do seu concurso. 🎯
              </p>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5"
              >
                <Plus size={14} />
                Criar Manual
              </button>
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs px-3 py-2 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
              >
                <Sparkles size={14} />
                Gerar com IA
              </button>
            </div>
          )}
        </div>

        {/* ================= ESTADO VAZIO ================= */}
        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#090d16]/30 border border-slate-900 rounded-2xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative border border-slate-800 bg-[#090d16] p-6 rounded-2xl shadow-xl mb-6 w-36 h-44 flex flex-col justify-between animate-bounce duration-3000">
              <div className="flex gap-2 justify-between">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400 font-bold font-mono">
                  ?
                </div>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold font-mono">
                  ?
                </div>
              </div>
              <div className="space-y-2 flex-1 mt-4">
                <div className="h-1.5 bg-slate-800 rounded-full w-full flex items-center pl-1">
                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full w-5/6" />
                <div className="h-1.5 bg-slate-950 rounded-full w-4/6" />
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500 w-[40%]" />
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-200">
              Nenhuma questão criada ainda
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Crie questões manualmente ou deixe nossa IA gerar simulados
              personalizados no estilo exato da sua prova!
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs px-4 py-2.5 rounded-xl transition-all font-medium flex items-center gap-1.5 active:scale-98"
              >
                Criar Manual
              </button>
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs px-4 py-2.5 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 active:scale-98"
              >
                <Sparkles size={14} />
                Gerar com IA
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 1: CRIAR MANUAL ================= */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-none">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Plus size={18} className="text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-200">
                    Criar Questão Customizada
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Monte sua própria base de dados de treino com total
                    controle.
                  </p>
                </div>
              </div>

              <form className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                      Vincular à Matéria
                    </label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500/50 transition-colors cursor-pointer">
                      <option value="Português">Português</option>
                      <option value="Raciocínio Lógico">
                        Raciocínio Lógico
                      </option>
                      <option value="Direito Constitucional">
                        Direito Constitucional
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                      Formato da Resposta
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl h-9.5 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTipoFormato("multipla");
                          setAlternativaCorreta("A");
                        }}
                        className={`py-1 rounded-lg font-bold transition-all text-center ${tipoFormato === "multipla" ? "bg-indigo-600 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        Múltipla Escolha
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoFormato("certo_errado");
                          setAlternativaCorreta("Certo");
                        }}
                        className={`py-1 rounded-lg font-bold transition-all text-center ${tipoFormato === "certo_errado" ? "bg-indigo-600 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        Certo / Errado
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Enunciado da Questão
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escreva o caso, lei ou pergunta da questão aqui..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500/50 transition-colors resize-none font-sans"
                  />
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                      Opções e Gabarito Alvo
                    </label>

                    {tipoFormato === "multipla" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleRemoveAlternativa}
                          disabled={alternativas.length <= 2}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-md text-slate-400 font-mono disabled:opacity-30"
                        >
                          - Remover
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAlternativa}
                          disabled={alternativas.length >= 5}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-md text-indigo-400 font-mono disabled:opacity-30"
                        >
                          + Adicionar
                        </button>
                      </div>
                    )}
                  </div>

                  {tipoFormato === "multipla" ? (
                    <div className="space-y-2">
                      {alternativas.map((alt) => (
                        <div
                          key={alt.id}
                          className="flex items-center gap-3 bg-slate-950/50 border border-slate-900 rounded-xl p-2 hover:border-slate-800 transition-colors"
                        >
                          <input
                            type="radio"
                            name="gabarito_manual"
                            checked={alternativaCorreta === alt.id}
                            onChange={() => setAlternativaCorreta(alt.id)}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer"
                          />
                          <span className="font-mono font-bold text-indigo-400">
                            {alt.id})
                          </span>
                          <input
                            type="text"
                            placeholder={`Texto da alternativa ${alt.id}...`}
                            className="bg-transparent border-0 w-full text-slate-200 placeholder:text-slate-700 focus:outline-hidden p-0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {["Certo", "Errado"].map((opcao) => (
                        <label
                          key={opcao}
                          className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${alternativaCorreta === opcao ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" : "bg-slate-950/50 border-slate-900 text-slate-400 hover:border-slate-800"}`}
                        >
                          <input
                            type="radio"
                            name="gabarito_cebraspe"
                            checked={alternativaCorreta === opcao}
                            onChange={() => setAlternativaCorreta(opcao)}
                            className="w-4 h-4 accent-indigo-500"
                          />
                          <span className="font-bold">{opcao}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Justificativa do Gabarito (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Insira o embasamento legal ou raciocínio lógico que resolve a questão..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500/50 transition-colors resize-none font-sans"
                  />
                </div>

                <button
                  type="button"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-950/30 active:scale-98 text-xs mt-2"
                >
                  Salvar Questão no Banco
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: GERAR COM IA ================= */}
        {isAIModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 scrollbar-none">
              <button
                onClick={() => !isGenerating && setIsAIModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors disabled:opacity-30"
                disabled={isGenerating}
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 border-b border-slate-900 pb-3.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">
                    Gerador Cognitivo por IA
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure o escopo e o motor neural para simular sua prova.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleGenerateSimulado}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Target size={12} className="text-indigo-400" /> Banca
                      Alvo
                    </label>
                    <select
                      value={banca}
                      onChange={(e) => setBanca(e.target.value)}
                      disabled={isGenerating}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500/50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <option value="Cebraspe">Cebraspe (Certo/Errado)</option>
                      <option value="FGV">FGV (Múltipla Escolha)</option>
                      <option value="FCC">FCC (Casos Práticos)</option>
                      <option value="Vunesp">Vunesp (Literal)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <BookOpen size={12} className="text-indigo-400" /> Matéria
                      Principal
                    </label>
                    <select
                      value={materia}
                      onChange={(e) => setMateria(e.target.value)}
                      disabled={isGenerating}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500/50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <option value="Português">Português</option>
                      <option value="Raciocínio Lógico">
                        Raciocínio Lógico
                      </option>
                      <option value="Direito Constitucional">
                        Direito Constitucional
                      </option>
                      <option value="Direito Administrativo">
                        Direito Administrativo
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Origem do Conteúdo da IA
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl h-9.5 items-center">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("banca")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "banca" ? "bg-indigo-600 text-slate-100" : "text-slate-400 hover:text-slate-200"} disabled:opacity-40`}
                    >
                      Histórico da Banca
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("texto")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "texto" ? "bg-indigo-600 text-slate-100" : "text-slate-400 hover:text-slate-200"} disabled:opacity-40`}
                    >
                      Colar Texto/Lei
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("pdf")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "pdf" ? "bg-indigo-600 text-slate-100" : "text-slate-400 hover:text-slate-200"} disabled:opacity-40`}
                    >
                      Upload de PDF
                    </button>
                  </div>
                </div>

                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  {fonteConteudo === "banca" && (
                    <p className="text-[11px] text-slate-500 bg-slate-950/40 border border-slate-900 rounded-xl p-3 leading-relaxed">
                      💡 A IA irá mapear o banco de dados público de concursos
                      recentes para prever e projetar tendências de cobrança da{" "}
                      <b>{banca}</b> sobre <b>{materia}</b> de forma autônoma.
                    </p>
                  )}

                  {fonteConteudo === "texto" && (
                    <div className="space-y-1.5">
                      <textarea
                        rows={3}
                        value={textoBase}
                        onChange={(e) => setTextoBase(e.target.value)}
                        disabled={isGenerating}
                        placeholder="Cole aqui o artigo da lei, o resumo ou o edital detalhado que você quer que a IA use como regra obrigatória para criar as questões..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500/50 transition-colors resize-none disabled:opacity-50"
                      />
                      <div className="text-right text-[10px] text-slate-600 font-mono">
                        {textoBase.length} / 20.000 caracteres
                      </div>
                    </div>
                  )}

                  {fonteConteudo === "pdf" && (
                    <div className="border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/30 rounded-xl p-5 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center gap-2">
                      <div className="p-2 bg-slate-950 rounded-lg text-slate-500 group-hover:text-indigo-400 transition-colors border border-slate-900">
                        <Plus size={16} />
                      </div>
                      <div>
                        <p className="text-slate-300 font-semibold text-[11px]">
                          Arraste seu PDF ou clique para buscar
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Suporta resumos, editais ou apostilas de até 20MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Nível de Dificuldade Teórica
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Fácil", "Média", "Difícil", "Aleatória"].map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setDificuldade(nivel)}
                        className={`py-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all ${
                          dificuldade === nivel
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-inner"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        } disabled:opacity-50`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Volume do Simulado
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["5", "10", "15", "20"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setQtdQuestoes(num)}
                        className={`py-2 rounded-xl border font-bold transition-all ${
                          qtdQuestoes === num
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-inner"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        } disabled:opacity-50`}
                      >
                        {num} Itens
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-slate-100 py-3 rounded-xl font-bold transition-all active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30 mt-2 text-xs disabled:opacity-80"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sincronizando sinapses com a {banca}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Gerar Simulado Inédito</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
