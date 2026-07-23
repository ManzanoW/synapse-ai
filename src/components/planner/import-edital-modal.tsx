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
} from "lucide-react";

interface TopicItem {
  id: string;
  name: string;
  selected: boolean;
}

// 🟢 1. Interface atualizada com a cor da matéria
interface SubjectItem {
  id: string;
  name: string;
  color?: string; // Hex da cor retornado pela IA
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
  cor?: string; // 🟢 Suporte para o retorno da IA
  color?: string;
  topicos?: string[];
  topics?: string[];
}

export function ImportEditalModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportEditalModalProps) {
  const [step, setStep] = useState<"input" | "preview">("input");
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
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
            "Para arquivos PDF longos, copie e cole a seção de Conteúdo Programático diretamente na aba 'Colar Texto do Edital' para melhores resultados.",
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

      const response = await fetch("/api/planner/parse-edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: contentToProcess }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar o edital");
      }

      console.log("Materias recebidas do backend:", result.materias);

      const rawList: RawMateria[] = Array.isArray(result.materias)
        ? result.materias
        : [];

      // 🟢 2. Mapeia o retorno PRESERVANDO a cor enviada pela IA
      const formattedSubjects: SubjectItem[] = rawList.map(
        (m: RawMateria, mIdx: number) => {
          const name = m.nome || m.materia || m.name || "Matéria sem nome";
          const subjectColor = m.cor || m.color; // Captura a cor!
          const rawTopics = Array.isArray(m.topicos)
            ? m.topicos
            : Array.isArray(m.topics)
              ? m.topics
              : [];

          return {
            id: `materia-${mIdx}`,
            name,
            color: subjectColor, // 🟢 Armazena a cor no estado do React
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
          "Nenhuma matéria foi encontrada no texto enviado. Tente colar apenas o Conteúdo Programático.",
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

  // 🟢 3. Confirmação e envio FINAL repassando a propriedade `cor`
  const handleConfirmImport = async () => {
    const finalData = parsedSubjects
      .filter((sub) => sub.selected)
      .map((sub) => ({
        name: sub.name,
        cor: sub.color, // 🟢 REPASSA A COR PARA A API DE IMPORTAÇÃO
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
      const response = await fetch("/api/planner/import-edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test",
          materias: finalData,
        }),
      });

      const rawText = await response.text();

      let result;
      try {
        result = JSON.parse(rawText);
      } catch {
        console.error("Servidor respondeu com HTML/Texto em vez de JSON:");
        console.error(rawText);
        throw new Error(
          `Resposta do servidor não é um JSON válido. Status: ${response.status}`,
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
      <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden text-slate-200 flex flex-col max-h-[85vh]">
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
                  ? "Extraia a estrutura de estudos automaticamente"
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
            <div className="space-y-6">
              <div className="flex p-1 bg-slate-900/80 border border-white/5 rounded-xl">
                <button
                  onClick={() => setActiveTab("file")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === "file"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Enviar Arquivo (TXT)
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === "text"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Colar Texto do Edital
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
                      Formatos suportados: TXT (ou cole em texto)
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
                  rows={7}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o conteúdo programático do edital (Ex: PORTUGUÊS: Ortografia...)"
                  className="w-full p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
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

                        {/* Indicador visual da Cor da Matéria */}
                        {sub.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                            title={`Cor do domínio: ${sub.color}`}
                          />
                        )}

                        <span className="text-xs font-semibold text-slate-200">
                          {sub.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
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
                  <span>Analisar Edital</span>
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
