"use client";

import { useState } from "react";
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
} from "lucide-react";

interface TopicItem {
  id: string;
  name: string;
  selected: boolean;
}

interface SubjectItem {
  id: string;
  name: string;
  color?: string;
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
  const [step, setStep] = useState<"input" | "preview">("input");
  const [activeTab, setActiveTab] = useState<"file" | "text">("text");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

      onImportSuccess?.(result);
      handleClose();
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden text-slate-200 flex flex-col max-h-[88vh]">
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
                {step === "input"
                  ? "Importar Edital com IA"
                  : "Revisar Matérias e Tópicos"}
              </h2>
              <p className="text-xs text-slate-400">
                {step === "input"
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
            <div className="space-y-5">
              {/* Card Didático de Onde Pegar */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 space-y-2">
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

              {/* Tabs */}
              <div className="flex p-1 bg-slate-900/80 border border-white/5 rounded-xl">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "text"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText size={14} />
                  <span>Colar Texto do Edital (Recomendado)</span>
                </button>
                <button
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "file"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Upload size={14} />
                  <span>Enviar TXT</span>
                </button>
              </div>

              {activeTab === "file" ? (
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
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o conteúdo programático copiado do edital PDF...&#10;&#10;Exemplo:&#10;MODULO II - CONHECIMENTOS ESPECÍFICOS:&#10;PERFIL 1: ANÁLISE DE NEGÓCIOS DE TI:&#10;1 Análise de negócios. 2 Gestão por processos..."
                  className="w-full p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none leading-relaxed font-mono"
                />
              )}
            </div>
          ) : (
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
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-900/40 border-t border-white/5 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {step === "input" ? (
            <button
              disabled={
                isProcessing ||
                (activeTab === "file" && !selectedFile) ||
                (activeTab === "text" && !rawText.trim())
              }
              onClick={handleProcessEdital}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
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
          ) : (
            <button
              disabled={isSaving}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
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
    </div>
  );
}
