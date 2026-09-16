"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  Zap,
  BookOpen,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sliders,
  FileText,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  extractTurboFlashcardsAction,
  ExtractTurboFlashcardsResult,
} from "@/actions/flashcard-actions";

interface TurboFlashcardExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks?: Array<{ id: string; title: string }>;
}

const TEMPLATES = [
  {
    label: "Art. 5º CF (Inviolabilidade)",
    text: `Art. 5º, XI - a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial;
Art. 5º, XII - é inviolável o sigilo da correspondência e das comunicações telegráficas, de dados e das comunicações telefônicas, salvo, no último caso, por ordem judicial, nas hipóteses e na forma que a lei estabelecer para fins de investigação criminal ou instrução processual penal;
Art. 5º, XIII - é livre o exercício de qualquer trabalho, ofício ou profissão, atendidas as qualificações profissionais que a lei estabelecer;`,
  },
  {
    label: "Lei 8.112 (Prazos de Posse)",
    text: `Art. 13. A posse dar-se-á pela assinatura do respectivo termo, no qual deverão constar as atribuições, os deveres, as responsabilidades e os direitos inerentes ao cargo ocupado.
§ 1º A posse ocorrerá no prazo de trinta dias contados da publicação do ato de provimento.
§ 6º Será tornado sem efeito o ato de provimento se a posse não ocorrer no prazo previsto no § 1º deste artigo.
Art. 15. Exercício é o efetivo desempenho das atribuições do cargo público ou da função de confiança.
§ 1º É de quinze dias o prazo para o servidor empossado em cargo público entrar em exercício, contados da data da posse.`,
  },
  {
    label: "Segurança da Informação",
    text: `Princípios da Segurança da Informação (CIDAM):
- Confidencialidade: a informação só é acessada por indivíduos autorizados. Criptografia é a técnica primária.
- Integridade: a informação é exata e não foi adulterada indevidamente em trânsito ou armazenamento. Hash (SHA-256) garante integridade.
- Disponibilidade: a informação está acessível quando requerida pelos usuários legítimos. Ataques DoS/DDoS miram a disponibilidade.
- Autenticidade: garante a identidade do autor da ação ou mensagem.
- Não-Repúdio (Irretratabilidade): impede que o autor negue a autoria de uma operação realizada digitalmente.`,
  },
];

export function TurboFlashcardExtractorModal({
  isOpen,
  onClose,
  decks = [],
}: TurboFlashcardExtractorModalProps) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [targetCount, setTargetCount] = useState<number>(10);
  const [mode, setMode] = useState<
    "CLOZE_AND_CONCEPTS" | "LAW_EXCEPTIONS" | "DEADLINES_AND_NUMBERS"
  >("CLOZE_AND_CONCEPTS");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractTurboFlashcardsResult | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (text: string, title: string) => {
    setRawText(text);
    if (!deckTitle) setDeckTitle(title);
  };

  const handleGenerate = async () => {
    if (!rawText.trim() || rawText.trim().length < 25) {
      setErrorMessage("Por favor, cole um texto com pelo menos 25 caracteres.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await extractTurboFlashcardsAction({
        rawText,
        deckTitle: deckTitle.trim() || undefined,
        deckId: selectedDeckId || undefined,
        targetCount,
        mode,
      });

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setErrorMessage(res.error || "Não foi possível gerar os flashcards.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro inesperado ao gerar flashcards."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
    setRawText("");
    setDeckTitle("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl bg-[#080c16] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Glow de fundo */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400 border border-indigo-500/30 shadow-md">
              <Zap size={20} className="fill-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Extrator Turbo de Flashcards por IA
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  FSRS / Anki
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cole a lei, PDF ou anotações e gere cards memoráveis em 3 segundos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="relative z-10 p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {result ? (
            /* Tela de Sucesso com Preview */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {result.cardsCount} Flashcards Gerados com Sucesso!
                    </h3>
                    <p className="text-xs text-emerald-300/80">
                      Baralho: <strong>{result.deckTitle}</strong> • Prontos para repetição espaçada.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer underline"
                >
                  Extrair Mais
                </button>
              </div>

              {/* Lista Preview dos Cards */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {result.cards.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase">
                        Card #{i + 1}
                      </span>
                      {c.details && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          Mnemônico
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      <strong>P:</strong> {c.question}
                    </p>
                    <p className="text-indigo-300 leading-relaxed pl-2 border-l-2 border-indigo-500/40">
                      <strong>R:</strong> {c.answer}
                    </p>
                    {c.details && (
                      <p className="text-[11px] text-slate-400 italic pt-1">
                        💡 {c.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Ação de Ir para Estudo */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/flashcards/study/${result.deckId}`);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Zap size={14} className="fill-white" />
                  <span>Praticar Este Baralho Agora</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Configuração & Entrada */
            <div className="space-y-4">
              {/* Templates Rápidos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-400" />
                    Exemplos Prontos para Testar:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Clique para preencher
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl.text, tmpl.label)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Copy size={12} className="text-indigo-400" />
                      <span>{tmpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea do Conteúdo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Texto Bruto, Artigo de Lei ou Resumo:
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {rawText.length} caracteres
                  </span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o artigo de lei (ex: Art. 37 da CF), súmula, conceito doutrinário ou anotações da aula..."
                  rows={6}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-2xl p-4 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all resize-none leading-relaxed font-mono"
                />
              </div>

              {/* Controles de Calibragem da IA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Quantidade de Cards */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Volume de Cards:
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTargetCount(num)}
                        className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                          targetCount === num
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Foco Pedagógico */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400">
                    Foco da IA:
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[
                      { id: "CLOZE_AND_CONCEPTS", label: "Cloze & Conceito" },
                      { id: "LAW_EXCEPTIONS", label: "Pegadinhas / Salvo" },
                      { id: "DEADLINES_AND_NUMBERS", label: "Prazos & Quóruns" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          setMode(
                            f.id as
                              | "CLOZE_AND_CONCEPTS"
                              | "LAW_EXCEPTIONS"
                              | "DEADLINES_AND_NUMBERS"
                          )
                        }
                        className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all truncate ${
                          mode === f.id
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title={f.label}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Título do Baralho (Opcional) & Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Título do Baralho (Opcional):
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    placeholder="Ex: Art. 5º CF - Direitos Individuais"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                {decks.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Adicionar em Baralho Existente:
                    </label>
                    <select
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="">+ Criar Novo Baralho Separado</option>
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Botão de Geração */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  ✨ Sintetizado via Gemini 2.5 Flash
                </span>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Extraindo {targetCount} Flashcards...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Extrair {targetCount} Flashcards com IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}