"use client";

import React, { useEffect, useState } from "react";
import { useSidebar } from "@/lib/sidebar-context";
import { motion } from "framer-motion";
import {
  Menu,
  HelpCircle,
  Plus,
  Sparkles,
  X,
  Loader2,
  Target,
  BookOpen,
  CheckCircle2,
  XCircle,
  History,
  Calendar,
  Layers,
} from "lucide-react";

// Tipagem para as questões que chegam da nossa API do Gemini
interface QuestaoIA {
  enunciado: string;
  formato: "multipla" | "certo_errado";
  alternativas?: Array<{ id: string; texto: string }>;
  gabaritoCorreto: string;
  justificativa: string;
}

// Interface em inglês para tipar os itens do histórico vindos do Supabase
interface QuizHistoryItem {
  id: string;
  banca: string;
  subject: string;
  difficulty: string;
  questions: QuestaoIA[];
  createdAt: string;
}

const renderEnunciado = (texto: string) => {
  // Regex para encontrar palavras entre aspas ou totalmente em MAIÚSCULAS
  const regex = /("[^"]+"|[A-Z]{3,})/g;

  return texto.split(regex).map((parte, i) => {
    if (parte.match(regex)) {
      return (
        <span
          key={i}
          className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold mx-0.5"
        >
          {parte.replace(/"/g, "")}
        </span>
      );
    }
    return <span key={i}>{parte}</span>;
  });
};

export default function QuestoesPage() {
  const { openSidebar } = useSidebar();

  // ================= ESTADOS GERAIS DA PÁGINA =================
  const [questions, setQuestions] = useState<QuestaoIA[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Controle de abas da interface: 'create' para o caderno/gerador e 'history' para o histórico
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Estados para armazenar o histórico de simulados salvos vindo da API
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Armazena as respostas selecionadas pelo usuário. Ex: { "0": "A", "1": "Certo" }
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  // Armazena quais questões já foram respondidas/checadas. Ex: { "0": true }
  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<number, boolean>
  >({});

  // ================= ESTADOS DO MODAL IA PREMIUM =================
  const [banca, setBanca] = useState("Cebraspe");
  const [materia, setMateria] = useState("");
  const [qtdQuestoes, setQtdQuestoes] = useState("5");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">(
    "banca",
  );
  const [dificuldade, setDificuldade] = useState("Média");
  const [textoBase, setTextoBase] = useState("");
  // =========================== LISTA DE MATERIAS ===========================
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

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

  useEffect(() => {
    if (isAIModalOpen) {
      fetch("/api/subjects/list")
        .then((res) => res.json())
        .then((json) => {
          const loadedSubjects = json.data || [];
          setSubjects(loadedSubjects);

          // Sincronização: se ainda não temos uma matéria definida,
          // pegamos a primeira da lista que acabou de chegar
          if (loadedSubjects.length > 0 && !materia) {
            setMateria(loadedSubjects[0].name);
          }
        })
        .catch(console.error);
    }
  }, [isAIModalOpen]);

  // ================= FUNÇÕES DE BUSCA DE HISTÓRICO =================

  // Função para carregar os simulados salvos do banco Supabase
  const fetchQuizHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/questions/list");
      const json = await response.json();
      setQuizHistory(json.data || []);
    } catch (error: unknown) {
      console.error("Failed to fetch quiz history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Função para injetar um simulado antigo na tela sem gastar tokens
  const handleLoadSavedQuiz = (
    savedQuestions: QuestaoIA[],
    savedBanca: string,
  ) => {
    setSelectedAnswers({});
    setCheckedQuestions({});
    setQuestions(savedQuestions);
    setBanca(savedBanca); // Atualiza a banca para a interface renderizar o padrão correto
    setActiveTab("create"); // Redireciona de volta para a aba do caderno de questões
  };

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

  // ================= Conexão Real HTTP Fetch =================
  const handleGenerateSimulado = async (e: React.FormEvent) => {
    e.preventDefault();

    // DEBUG: Vamos ver o que está acontecendo no console
    console.log("Matéria selecionada (materia):", materia);
    console.log("Lista de Subjects (subjects):", subjects);

    // Verifica se existe alguma matéria com o nome idêntico
    const isMateriaValid = subjects.some(
      (sub) => sub.name.trim() === materia.trim(),
    );

    console.log("A matéria é válida?", isMateriaValid);

    if (!materia || !isMateriaValid) {
      alert(
        `Erro de validação: A matéria "${materia}" não foi encontrada na lista de subjects. Verifique se o nome está idêntico.`,
      );
      return;
    }
    // --------------------------

    setIsGenerating(true);
    setSelectedAnswers({});
    setCheckedQuestions({});

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banca,
          materia,
          qtdQuestoes,
          fonteConteudo,
          dificuldade,
          textoBase: fonteConteudo === "texto" ? textoBase : "",
        }),
      });

      const json = await response.json();
      const generatedQuestions = json.data || [];
      setQuestions(generatedQuestions);
      setIsAIModalOpen(false);

      // 💾 SALVAMENTO AUTOMÁTICO: Envia de forma assíncrona para o Supabase
      if (generatedQuestions.length > 0) {
        await fetch("/api/questions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            banca,
            subject: materia,
            difficulty: dificuldade,
            questions: generatedQuestions,
          }),
        }).catch((err) => console.error("Database sync error:", err));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(error);
      alert(`Erro: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
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
                Simulado inédito focado na banca {banca}. Avalie seu rendimento
                em tempo real com feedbacks inteligentes.
              </p>
            </div>
          </div>

          {/* Botões do topo aparecem caso já tenhamos um simulado na tela */}
          {questions.length > 0 && activeTab === "create" && (
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-50 text-slate-100 text-xs px-3 py-2 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
            >
              <Sparkles size={14} />
              Novo Simulado com IA
            </button>
          )}
        </div>

        {/* ================= SELETORES DE ABA (TABS INTERFACE) ================= */}
        <div className="flex border-b border-slate-900 gap-2">
          <button
            onClick={() => setActiveTab("create")}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            📝 Caderno Atual
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              fetchQuizHistory(); // Executa a busca diretamente na ação do usuário
            }}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 rounded-t-xl flex items-center gap-2 ${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <History size={14} />
            Meus Simulados Salvos
          </button>
        </div>

        {/* ================= ABA 1: COMPONENTE DE RESOLUÇÃO / ESTADO VAZIO ================= */}
        {activeTab === "create" && (
          <>
            {/* ESTADO VAZIO */}
            {questions.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 bg-[#090d16]/30 border border-slate-900 rounded-2xl relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative border border-slate-800 bg-[#090d16] p-6 rounded-2xl shadow-xl mb-6 w-36 h-44 flex flex-col justify-between animate-bounce duration-3000">
                  <div className="flex gap-2 justify-between">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400 font-bold font-mono select-none">
                      ?
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold font-mono select-none">
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
                  Nenhuma questão ativa no caderno
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                  Crie questões manualmente, deixe nossa IA gerar simulados, ou
                  escolha um teste pronto na aba de salvos!
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

            {/* LISTA DE QUESTÕES DO CADERNO ATIVO */}
            {questions.length > 0 && (
              <div className="space-y-6 pb-12">
                {questions.map((questao, index) => {
                  const respondida = checkedQuestions[index];
                  const alternativaSelecionada = selectedAnswers[index];
                  const acertou =
                    alternativaSelecionada === questao.gabaritoCorreto;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }} // Começa a animar quando falta 100px para entrar na tela
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`rounded-2xl p-6 border shadow-xl transition-all duration-500 ${
                        respondida
                          ? acertou
                            ? "bg-[#090d16]/80 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                            : "bg-[#090d16]/80 border-rose-500/30 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]"
                          : "bg-[#090d16]/60 border-slate-900 shadow-xl"
                      }`}
                    >
                      {/* Cabeçalho da Questão */}
                      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-3">
                        <span>Questão {index + 1}</span>
                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full text-[10px]">
                          {questao.formato === "multipla"
                            ? "Múltipla Escolha"
                            : "Certo / Errado"}
                        </span>
                      </div>

                      {/* Enunciado da Questão */}
                      <p className="text-slate-200 text-lg font-medium mb-6 leading-relaxed whitespace-pre-line">
                        {renderEnunciado(questao.enunciado)}
                      </p>

                      {/* Alternativas */}
                      <div className="space-y-3 mb-6">
                        {questao.formato === "multipla"
                          ? questao.alternativas?.map((alt) => {
                              const isSelected =
                                alternativaSelecionada === alt.id;
                              return (
                                <button
                                  key={alt.id}
                                  disabled={respondida}
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({
                                      ...prev,
                                      [index]: alt.id,
                                    }))
                                  }
                                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 
                                  ${
                                    respondida
                                      ? alt.id === questao.gabaritoCorreto
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                        : isSelected
                                          ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                          : "bg-slate-950/20 border-slate-900 text-slate-600"
                                      : isSelected
                                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30"
                                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                    ${isSelected ? "bg-indigo-600 text-slate-100" : "bg-slate-900 border border-slate-800 text-slate-400"}`}
                                  >
                                    {alt.id}
                                  </span>
                                  <span className="pt-0.5">{alt.texto}</span>
                                </button>
                              );
                            })
                          : ["Certo", "Errado"].map((opcao) => {
                              const isSelected =
                                alternativaSelecionada === opcao;
                              return (
                                <button
                                  key={opcao}
                                  disabled={respondida}
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({
                                      ...prev,
                                      [index]: opcao,
                                    }))
                                  }
                                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3
                                  ${
                                    respondida
                                      ? opcao === questao.gabaritoCorreto
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                        : isSelected
                                          ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                          : "bg-slate-950/20 border-slate-900 text-slate-600"
                                      : isSelected
                                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30"
                                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-300"
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${opcao === "Certo" ? "bg-emerald-500" : "bg-rose-500"}`}
                                  />
                                  {opcao}
                                </button>
                              );
                            })}
                      </div>

                      {/* Ações de Envio e Gabarito */}
                      <div className="flex flex-col gap-4">
                        {!respondida ? (
                          <button
                            disabled={!alternativaSelecionada}
                            onClick={() =>
                              setCheckedQuestions((prev) => ({
                                ...prev,
                                [index]: true,
                              }))
                            }
                            className="w-full sm:w-auto self-end px-5 py-2 bg-slate-100 dark:bg-slate-100 text-slate-950 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            Responder Questão
                          </button>
                        ) : (
                          <div className="rounded-xl p-4 animate-in fade-in duration-300 bg-slate-950/60 border border-slate-900">
                            <div className="flex items-center gap-2 font-bold text-xs mb-2.5">
                              {acertou ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 size={14} /> Você acertou!
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center gap-1">
                                  <XCircle size={14} /> Resposta incorreta
                                </span>
                              )}
                              <span className="text-slate-500 font-normal">
                                |
                              </span>
                              <span className="text-slate-400 font-normal">
                                Gabarito oficial:{" "}
                                <strong className="text-slate-200 font-bold">
                                  {questao.gabaritoCorreto}
                                </strong>
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <strong className="text-slate-300 font-semibold">
                                Justificativa teórica:
                              </strong>{" "}
                              {questao.justificativa}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= ABA 2: COMPONENTE DE HISTÓRICO DE SIMULADOS ================= */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-base font-bold text-slate-200">
                Histórico de Exercícios
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Refaça seus simulados salvos de forma 100% gratuita sem consumir
                sua cota diária de IA.
              </p>
            </div>

            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-xs">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
                <span>Buscando registros no Supabase...</span>
              </div>
            ) : quizHistory.length === 0 ? (
              <div className="text-center py-12 bg-[#090d16]/20 border border-slate-900 rounded-2xl border-dashed">
                <p className="text-slate-500 text-xs">
                  Você ainda não gerou nenhum simulado com salvamento
                  automático.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {quizHistory.map((item) => {
                  const questionsArray = Array.isArray(item.questions)
                    ? item.questions
                    : [];
                  const formattedDate = new Date(
                    item.createdAt,
                  ).toLocaleDateString("pt-BR");

                  return (
                    <div
                      key={item.id}
                      className="bg-[#090d16]/40 border border-slate-900 p-5 rounded-2xl shadow-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {item.banca}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar size={10} /> {formattedDate}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-200 text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {item.subject}
                          </h3>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Layers size={10} /> {item.difficulty}
                            </span>
                            <span>•</span>
                            <span>{questionsArray.length} questões</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleLoadSavedQuiz(questionsArray, item.banca)
                        }
                        className="w-full text-center py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl mt-5 transition-all active:scale-98"
                      >
                        ⚡ Refazer Caderno (Grátis)
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200">
                      <option value="Português">Português</option>
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
                        className={`py-1 rounded-lg font-bold transition-all text-center ${tipoFormato === "multipla" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                      >
                        Múltipla Escolha
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoFormato("certo_errado");
                          setAlternativaCorreta("Certo");
                        }}
                        className={`py-1 rounded-lg font-bold transition-all text-center ${tipoFormato === "certo_errado" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none"
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
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-slate-400 disabled:opacity-30"
                        >
                          - Remover
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAlternativa}
                          disabled={alternativas.length >= 5}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-indigo-400 disabled:opacity-30"
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
                          className="flex items-center gap-3 bg-slate-950/50 border border-slate-900 rounded-xl p-2"
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
                            className="bg-transparent border-0 w-full text-slate-200 focus:outline-hidden p-0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {["Certo", "Errado"].map((opcao) => (
                        <label
                          key={opcao}
                          className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer ${alternativaCorreta === opcao ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" : "bg-slate-950/50 border-slate-900"}`}
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
                    placeholder="Insira o embasamento legal..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none"
                  />
                </div>
                <button
                  type="button"
                  className="w-full bg-indigo-600 text-slate-100 py-3 rounded-xl font-bold"
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
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 cursor-pointer"
                    >
                      <option value="Cebraspe">Cebraspe</option>
                      <option value="FGV">FGV</option>
                      <option value="FCC">FCC</option>
                      <option value="Vunesp">Vunesp</option>
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 cursor-pointer"
                    >
                      {subjects.length > 0 ? (
                        subjects.map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name}
                          </option>
                        ))
                      ) : (
                        <option value={materia}>{materia}</option> // Fallback caso ainda carregando
                      )}
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
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "banca" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                    >
                      Histórico da Banca
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("texto")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "texto" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                    >
                      Colar Texto/Lei
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFonteConteudo("pdf")}
                      className={`py-1 rounded-lg font-bold text-[10px] transition-all text-center ${fonteConteudo === "pdf" ? "bg-indigo-600 text-slate-100" : "text-slate-400"}`}
                    >
                      Upload de PDF
                    </button>
                  </div>
                </div>
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  {fonteConteudo === "banca" && (
                    <p className="text-[11px] text-slate-500 bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                      💡 A IA irá mapear o banco de dados público de concursos
                      para prever e projetar tendências.
                    </p>
                  )}
                  {fonteConteudo === "texto" && (
                    <textarea
                      rows={3}
                      value={textoBase}
                      onChange={(e) => setTextoBase(e.target.value)}
                      disabled={isGenerating}
                      placeholder="Cole aqui o artigo da lei..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 resize-none"
                    />
                  )}
                  {fonteConteudo === "pdf" && (
                    <div className="border border-dashed border-slate-800 bg-slate-950/30 rounded-xl p-5 text-center cursor-pointer text-slate-300 font-semibold text-[11px]">
                      Arraste seu PDF ou clique para buscar
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 border-t border-slate-900 pt-3.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Nível de Dificuldade
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Fácil", "Média", "Difícil", "Aleatória"].map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setDificuldade(nivel)}
                        className={`py-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all ${dificuldade === nivel ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
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
                        className={`py-2 rounded-xl border font-bold transition-all ${qtdQuestoes === num ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                      >
                        {num} Q
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sincronizando sinapses...</span>
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
