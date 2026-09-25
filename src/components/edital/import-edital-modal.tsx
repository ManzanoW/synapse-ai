"use client";

import { useState, useEffect } from "react";
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  FileText,
  HelpCircle,
  Play,
  Briefcase,
  Crown,
  Lock,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { getAiQuotaStatusAction } from "@/actions/quota-actions";
import { StarterEditalSelector } from "./StarterEditalSelector";

interface TopicItem {
  id: string;
  name: string;
  selected: boolean;
}

interface SubjectItem {
  id: string;
  name: string;
  color?: string;
  weight?: number;
  selected: boolean;
  topics: TopicItem[];
}

interface ImportEditalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: { materias: SubjectItem[] }) => void;
}

interface RawMateria {
  nome?: string;
  materia?: string;
  name?: string;
  cor?: string;
  color?: string;
  topicos?: string[];
  topics?: string[];
}

const DATAPREV_EXAMPLE = `MODULO II - CONHECIMENTOS ESPECÍFICOS:
PERFIL 1: ANÁLISE DE NEGÓCIOS DE TI:
1 Análise de negócios. 2 Gestão por processos e gestão funcional. 2.1 Ciclo PDCA. 3 Gerenciamento de Processos de Negócio (BPM CBOK v4.0). 3.1 Conceitos, modelagem de processos. 6 Gerenciamento de indicadores, metas e resultados. 7 Gestão Ágil de Projetos. 8. Gerenciamento de produtos. 9. COBIT 2019. 10 ITIL v4.

EXPERIÊNCIA DO USUÁRIO (UX) E DESIGN:
13 User experience (UX): 13.1 Conceitos de acessibilidade e usabilidade. 13.2 Histórias do usuário. 14 Storytelling com dados. 15 Prototipação. 16 Design thinking. 17 Análise de personas de usuários de software. 18 Mínimo Produto Viável (MVP).`;

export function ImportEditalModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportEditalModalProps) {
  const [step, setStep] = useState<"input" | "preview" | "success">("input");
  const [importedSummary, setImportedSummary] = useState<{
    subjectsCount: number;
    topicsCount: number;
  }>({ subjectsCount: 0, topicsCount: 0 });
  const [activeTab, setActiveTab] = useState<"text" | "career" | "file" | "pdf">("text");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAiQuotaStatusAction().then((res) => {
        if (res.success && res.data) {
          setIsPro(res.data.isUnlimited);
        }
      });
    }
  }, [isOpen]);

  const [parsedSubjects, setParsedSubjects] = useState<SubjectItem[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >({});

  if (!isOpen) return null;

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const handleProcessEdital = async () => {
    setIsProcessing(true);

    try {
      let contentToProcess = "";

      if (activeTab === "file" && selectedFile) {
        if (selectedFile.name.endsWith(".txt")) {
          contentToProcess = await readFileAsText(selectedFile);
        } else if (
          selectedFile.type === "application/pdf" ||
          selectedFile.name.endsWith(".pdf")
        ) {
          alert(
            "Para PDFs do edital, selecione e copie o trecho de Conteúdo Programático diretamente do seu leitor de PDF e cole na aba 'Colar Texto do Edital'.",
          );
          setIsProcessing(false);
          setActiveTab("text");
          return;
        }
      } else {
        contentToProcess = rawText;
      }

      if (!contentToProcess.trim()) {
        alert("Por favor, insira o texto do edital antes de prosseguir.");
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/edital/parse-edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: contentToProcess }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar o edital");
      }

      const rawList: RawMateria[] = Array.isArray(result.materias)
        ? result.materias
        : [];

      const formattedSubjects: SubjectItem[] = rawList.map(
        (m: RawMateria, mIdx: number) => {
          const name = m.nome || m.materia || m.name || "Matéria sem nome";
          const subjectColor = m.cor || m.color;
          const rawTopics = Array.isArray(m.topicos)
            ? m.topicos
            : Array.isArray(m.topics)
              ? m.topics
              : [];

          return {
            id: `materia-${mIdx}`,
            name,
            color: subjectColor,
            weight: 5.0,
            selected: true,
            topics: rawTopics.map((t: string, tIdx: number) => ({
              id: `topico-${mIdx}-${tIdx}`,
              name: t,
              selected: true,
            })),
          };
        },
      );

      if (formattedSubjects.length === 0) {
        alert(
          "Nenhuma matéria foi encontrada no texto enviado. Tente colar apenas o trecho do Conteúdo Programático.",
        );
        return;
      }

      setParsedSubjects(formattedSubjects);

      const initialExpanded: Record<string, boolean> = {};
      formattedSubjects.forEach((sub) => (initialExpanded[sub.id] = true));
      setExpandedSubjects(initialExpanded);

      setStep("preview");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao importar edital:", error);
      alert(`Ocorreu um erro: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSubjectWeight = (subjectId: string, weight: number) => {
    setParsedSubjects((prev) =>
      prev.map((sub) => (sub.id === subjectId ? { ...sub, weight } : sub)),
    );
  };

  const toggleSubjectSelect = (subjectId: string) => {
    setParsedSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id === subjectId) {
          const nextSelected = !sub.selected;
          return {
            ...sub,
            selected: nextSelected,
            topics: sub.topics.map((t) => ({ ...t, selected: nextSelected })),
          };
        }
        return sub;
      }),
    );
  };

  const toggleTopicSelect = (subjectId: string, topicId: string) => {
    setParsedSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id === subjectId) {
          const updatedTopics = sub.topics.map((t) =>
            t.id === topicId ? { ...t, selected: !t.selected } : t,
          );
          const hasAnyTopicSelected = updatedTopics.some((t) => t.selected);
          return {
            ...sub,
            selected: hasAnyTopicSelected,
            topics: updatedTopics,
          };
        }
        return sub;
      }),
    );
  };

  const toggleAccordion = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const handleConfirmImport = async () => {
    const finalData = parsedSubjects
      .filter((sub) => sub.selected)
      .map((sub) => ({
        name: sub.name,
        cor: sub.color,
        weight: sub.weight ?? 5.0,
        topics: sub.topics
          .filter((t) => t.selected)
          .map((t) => ({ name: t.name })),
      }))
      .filter((sub) => sub.topics.length > 0);

    if (finalData.length === 0) {
      alert("Selecione ao menos um tópico para importar.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/edital/import-edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test",
          materias: finalData,
        }),
      });

      const rawResText = await response.text();

      let result;
      try {
        result = JSON.parse(rawResText);
      } catch {
        throw new Error(
          `Resposta do servidor não é válida. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Erro no servidor");
      }

      const totalTopicsCount = finalData.reduce((acc, s) => acc + s.topics.length, 0);
      setImportedSummary({
        subjectsCount: finalData.length,
        topicsCount: totalTopicsCount,
      });

      onImportSuccess?.(result);
      setStep("success");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error("Erro na importação:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setRawText("");
    setSelectedFile(null);
    setParsedSubjects([]);
    setImportedSummary({ subjectsCount: 0, topicsCount: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-slate-950 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden text-slate-200 flex flex-col max-h-[88vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button
                onClick={() => setStep("input")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors mr-1 cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {step === "success"
                  ? "Edital Mapeado com Sucesso"
                  : step === "input"
                    ? "Importar Edital com IA"
                    : "Revisar Matérias e Tópicos"}
              </h2>
              <p className="text-xs text-slate-400">
                {step === "success"
                  ? "Disciplinas mapeadas e prontas para o seu plano"
                  : step === "input"
                    ? "Extraia a estrutura de estudos do seu concurso automaticamente"
                    : "Selecione o que deseja adicionar ao seu Planner"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {step === "input" ? (
            <div className="space-y-4">
              {/* Card Didático Contextual por Aba */}
              {activeTab === "text" && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <HelpCircle size={15} />
                      Como pegar do PDF do edital?
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab("text");
                        setRawText(DATAPREV_EXAMPLE);
                      }}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      <Play size={11} className="fill-amber-400" />
                      <span>Testar com Exemplo</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Abra o PDF do seu concurso (ex:{" "}
                    <strong>DATAPREV, FGV, Cebraspe</strong>), vá na seção de{" "}
                    <strong>CONHECIMENTOS ESPECÍFICOS</strong>, selecione o texto
                    bruto dos tópicos e cole abaixo. Não precisa formatar nada!
                  </p>
                </div>
              )}

              {activeTab === "career" && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-200">Escolha uma carreira pronta ou use a IA</p>
                      <p className="text-[11px] text-slate-400">Ative o plano em 1 clique ou digite qualquer cargo no campo abaixo.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Colar edital próprio &rarr;
                  </button>
                </div>
              )}

              {activeTab === "file" && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 text-xs text-slate-300 flex items-center gap-2.5">
                  <Upload size={16} className="text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Envie um arquivo <strong>.txt</strong> com o texto copiado do edital. A IA irá processar e montar o mapa de estudos.
                  </p>
                </div>
              )}

              {/* Tabs Reordenadas: Colar Texto Primeiro, Carreiras Segundo */}
              <div className="flex flex-wrap p-1 bg-slate-900/80 border border-white/5 rounded-xl gap-1">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex-1 min-w-[130px] py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "text"
                      ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText size={14} />
                  <span>Colar Texto do Edital</span>
                </button>
                <button
                  onClick={() => setActiveTab("career")}
                  className={`flex-1 min-w-[130px] py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "career"
                      ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Carreiras & IA (1 Clique)</span>
                </button>
                <button
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 min-w-[100px] py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "file"
                      ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Upload size={14} />
                  <span>Enviar TXT</span>
                </button>
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`flex-1 min-w-[110px] py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "pdf"
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText size={14} className="text-amber-400" />
                  <span>Arquivo PDF</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                    <Crown size={8} /> PRO
                  </span>
                </button>
              </div>

              {activeTab === "career" ? (
                <div className="pt-2">
                  <StarterEditalSelector
                    onSuccess={(data) => {
                      onImportSuccess({ materias: [] });
                      setImportedSummary({
                        subjectsCount: data?.subjectsCount || 5,
                        topicsCount: data?.topicsCount || 25,
                      });
                      setStep("success");
                      confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                    }}
                    compact={true}
                    showCustomLink={false}
                  />
                </div>
              ) : activeTab === "pdf" ? (
                !isPro ? (
                  <div className="py-6 px-4 rounded-2xl bg-slate-900/60 border border-amber-500/30 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                        <Crown size={28} />
                      </div>
                      <div className="absolute -top-1 -right-1 p-1 rounded-md bg-amber-500 text-slate-950 font-bold">
                        <Lock size={12} />
                      </div>
                    </div>

                    <div className="space-y-1.5 max-w-md">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Recurso Exclusivo Synapse Pro
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Leitor Inteligente de Editais em PDF
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Nossa IA Vision vasculha o PDF completo de 100+ páginas da banca (FGV, Cebraspe, FCC), detecta o anexo de Conteúdo Programático e organiza disciplinas e tópicos automaticamente com zero trabalho manual.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-2 pt-2">
                      <Link
                        href="/pricing"
                        onClick={onClose}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
                      >
                        <Crown size={15} />
                        <span>Desbloquear Leitor de PDF com Synapse Pro</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setActiveTab("text")}
                        className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Usar opção gratuita (Colar Texto do Edital)
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-amber-500/40 rounded-xl cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      <div className="p-3 mb-2 rounded-full bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        {selectedFile
                          ? selectedFile.name
                          : "Clique para enviar o PDF do Edital Oficial"}
                      </p>
                      <p className="text-[10px] text-amber-300/80 mt-1">
                        Formatos PDF até 25MB • Processamento Synapse Pro
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) =>
                        e.target.files && setSelectedFile(e.target.files[0])
                      }
                    />
                  </label>
                )
              ) : activeTab === "file" ? (
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                    <div className="p-3 mb-2 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                      <Upload size={22} />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">
                      {selectedFile
                        ? selectedFile.name
                        : "Clique para enviar um arquivo TXT"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Para arquivos PDF, utilize a aba &quot;Colar Texto do
                      Edital&quot;
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt"
                    onChange={(e) =>
                      e.target.files && setSelectedFile(e.target.files[0])
                    }
                  />
                </label>
              ) : (
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o conteúdo programático copiado do edital PDF...&#10;&#10;Exemplo:&#10;MODULO II - CONHECIMENTOS ESPECÍFICOS:&#10;PERFIL 1: ANÁLISE DE NEGÓCIOS DE TI:&#10;1 Análise de negócios. 2 Gestão por processos..."
                  className="w-full min-h-[220px] p-4 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-y leading-relaxed font-mono"
                />
              )}
            </div>
          ) : step === "preview" ? (
            /* PREVIEW STEP */
            <div className="space-y-3">
              {parsedSubjects.map((sub) => {
                const isExpanded = expandedSubjects[sub.id];
                const selectedCount = sub.topics.filter(
                  (t) => t.selected,
                ).length;

                return (
                  <div
                    key={sub.id}
                    className="border border-white/5 rounded-xl bg-slate-900/40 overflow-hidden"
                  >
                    {/* Cabeçalho da Matéria */}
                    <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSubjectSelect(sub.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            sub.selected
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          {sub.selected && <Check size={12} />}
                        </button>

                        {sub.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                            title={`Cor atribuída: ${sub.color}`}
                          />
                        )}

                        <span className="text-xs font-semibold text-slate-200">
                          {sub.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {selectedCount}/{sub.topics.length} tópicos
                        </span>

                        <div
                          className="flex items-center gap-1 bg-slate-950/90 border border-amber-500/25 px-2 py-0.5 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                            Peso:
                          </span>
                          <select
                            value={sub.weight ?? 5.0}
                            onChange={(e) =>
                              updateSubjectWeight(
                                sub.id,
                                parseFloat(e.target.value) || 5.0,
                              )
                            }
                            className="bg-transparent text-amber-300 text-[11px] font-mono font-bold outline-none cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => (
                              <option
                                key={w}
                                value={w}
                                className="bg-[#090d16] text-slate-200"
                              >
                                {w.toFixed(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAccordion(sub.id)}
                        className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    </div>

                    {/* Lista de Tópicos */}
                    {isExpanded && (
                      <div className="p-3 space-y-1.5 pl-8">
                        {sub.topics.map((topic) => (
                          <div
                            key={topic.id}
                            onClick={() => toggleTopicSelect(sub.id, topic.id)}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                topic.selected
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "border-slate-700 bg-slate-900"
                              }`}
                            >
                              {topic.selected && <Check size={10} />}
                            </div>
                            <span
                              className={`text-xs ${
                                topic.selected
                                  ? "text-slate-300"
                                  : "text-slate-500 line-through"
                              }`}
                            >
                              {topic.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ETAPA DE SUCESSO & INTEGRAÇÃO COM PLANNER */
            <div className="py-8 px-4 flex flex-col items-center text-center space-y-6 max-w-lg mx-auto animate-fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                  <Check size={32} />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-slate-950 text-xs shadow-md">
                  <Sparkles size={12} className="text-amber-300" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold font-mono">
                  Mapeamento Concluído com Sucesso
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Edital Integrado ao Synapse! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                  Foram cadastradas{" "}
                  <strong className="text-white font-semibold">
                    {importedSummary.subjectsCount} disciplinas
                  </strong>{" "}
                  e{" "}
                  <strong className="text-white font-semibold">
                    {importedSummary.topicsCount} tópicos
                  </strong>{" "}
                  no seu plano de estudos.
                </p>
              </div>

              {/* Card Destaque: Próximo Passo Recomendado */}
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 border border-indigo-500/30 text-left space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Próximo Passo Recomendado
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <CalendarDays size={16} className="text-indigo-400" />
                    <span>Distribuir Matérias no Cronograma Semanal</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                    Nosso algoritmo calcula a prioridade e os pesos das disciplinas para montar seu ciclo semanal de estudos automaticamente.
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="w-full space-y-2.5 pt-1">
                <Link
                  href="/week"
                  onClick={() => {
                    handleClose();
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/70 transition-all cursor-pointer group active:scale-95"
                >
                  <CalendarDays size={16} />
                  <span>Montar Cronograma Semanal Agora</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-white/5 transition-all cursor-pointer"
                >
                  Ver Edital Verticalizado
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé (apenas para input e preview) */}
        {step !== "success" && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-900/40 border-t border-white/5 shrink-0">
            <div className="text-xs text-slate-400">
              {activeTab === "career" && step === "input" && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400 shrink-0" />
                  <span>Ative uma carreira acima ou digite seu cargo com IA</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {activeTab === "career" && step === "input" ? "Fechar" : "Cancelar"}
              </button>

              {step === "input" && activeTab !== "career" && (
                <button
                  disabled={
                    isProcessing ||
                    (activeTab === "file" && !selectedFile) ||
                    (activeTab === "text" && !rawText.trim())
                  }
                  onClick={handleProcessEdital}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Analisando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Analisar Edital com IA</span>
                    </>
                  )}
                </button>
              )}

              {step === "preview" && (
                <button
                  disabled={isSaving}
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Salvando no Planner...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Confirmar e Importar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
