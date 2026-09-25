"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Loader2,
  Gavel,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle,
  Scale,
  X,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  OralQuestionData,
  OralEvaluationResult,
  generateOralQuestionAction,
  evaluateOralAnswerAction,
} from "@/actions/oral-exam-actions";
import { updateUserCareerFocusAction } from "@/actions/edital-templates-actions";
import { enableLawModuleInTargetRole } from "@/lib/career-utils";

interface ProvaOralClientProps {
  isLawUser?: boolean;
  userCareer?: string;
  userRole?: string;
}

export default function ProvaOralClient({
  isLawUser = true,
  userCareer = "Concurso Geral",
  userRole = "Concurso Geral",
}: ProvaOralClientProps) {
  // Banner para usuários com foco em outra carreira
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isPinnedSuccess, setIsPinnedSuccess] = useState(false);

  const handlePinToSidebar = async () => {
    try {
      setIsPinning(true);
      const newRole = enableLawModuleInTargetRole(userRole);
      const res = await updateUserCareerFocusAction({
        targetRole: newRole,
        careerFocus: userCareer,
      });
      if (res.success) {
        setIsPinnedSuccess(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("career-updated"));
        }
      }
    } catch (err) {
      console.error("Erro ao fixar módulo de direito:", err);
    } finally {
      setIsPinning(false);
    }
  };

  // Configuração
  const [selectedCargo, setSelectedCargo] = useState("Delegado de Polícia Civil / Federal");
  const [selectedDisciplina, setSelectedDisciplina] = useState("Direito Processual Penal");
  const [customPonto, setCustomPonto] = useState("");

  // Fluxo de Sabatina
  const [stage, setStage] = useState<"SETUP" | "EXAM" | "EVALUATING" | "RESULT">("SETUP");
  const [questionData, setQuestionData] = useState<OralQuestionData | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Microfone e Reconhecimento de Voz
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Cronômetro
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // TTS Voz do Examinador
  const [isPlayingExaminerAudio, setIsPlayingExaminerAudio] = useState(false);

  // Resultado
  const [evaluation, setEvaluation] = useState<OralEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const cargos = [
    "Delegado de Polícia Civil / Federal",
    "Juiz de Direito / Magistratura Estadual",
    "Promotor de Justiça / Ministério Público",
    "Defensor Público Estadual / da União",
    "Auditor Fiscal da Receita Federal / Estadual",
  ];

  const disciplinas = [
    "Direito Processual Penal",
    "Direito Penal",
    "Direito Constitucional",
    "Direito Administrativo",
    "Direito Tributário",
  ];

  // Inicializa o Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Timer regressivo durante a arguição
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerActive) {
      handleFinishAnswer();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, secondsRemaining]);

  // Voz do Examinador (Speech Synthesis)
  const speakExaminerQuestion = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95; // Tom solene e formal
    utterance.pitch = 0.9;

    utterance.onstart = () => setIsPlayingExaminerAudio(true);
    utterance.onend = () => setIsPlayingExaminerAudio(false);
    utterance.onerror = () => setIsPlayingExaminerAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopExaminerAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingExaminerAudio(false);
    }
  };

  const handleStartExam = async () => {
    setIsGeneratingQuestion(true);
    try {
      const res = await generateOralQuestionAction({
        cargo: selectedCargo,
        disciplina: selectedDisciplina,
        ponto: customPonto.trim() || undefined,
      });

      if (res.success && res.data) {
        setQuestionData(res.data);
        setSecondsRemaining(res.data.tempoRecomendadoSegundos || 180);
        setTranscript("");
        setStage("EXAM");
        setIsTimerActive(true);

        // Enuncia a pergunta em voz alta com a banca
        speakExaminerQuestion(res.data.enunciadoExaminador);
      }
    } catch (err) {
      alert("Erro ao iniciar a sabatina.");
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (typeof window === "undefined") return;

    // Para o áudio da banca se estiver falando
    stopExaminerAudio();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz direto. Digite sua resposta no campo.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Erro no reconhecimento de fala:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Falha ao iniciar SpeechRecognition:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFinishAnswer = async () => {
    stopRecording();
    stopExaminerAudio();
    setIsTimerActive(false);

    if (!transcript.trim()) {
      alert("Por favor, responda à questão falando ao microfone ou digitando antes de encerrar.");
      return;
    }

    setStage("EVALUATING");
    setEvalError(null);

    const totalDuration = (questionData?.tempoRecomendadoSegundos || 180) - secondsRemaining;

    try {
      const res = await evaluateOralAnswerAction({
        cargo: questionData?.cargo || selectedCargo,
        disciplina: questionData?.disciplina || selectedDisciplina,
        questionText: questionData?.enunciadoExaminador || "",
        candidateTranscript: transcript,
        durationSeconds: Math.max(15, totalDuration),
      });

      if (!res.success || !res.data) {
        setEvalError(res.error || "Não foi possível concluir a avaliação da banca.");
        setStage("EXAM");
        return;
      }

      setEvaluation(res.data);
      setStage("RESULT");

      // Dispara celebração se aprovado
      if (res.data.isApproved) {
        try {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err: any) {
      setEvalError(err?.message || "Erro de conexão ao avaliar.");
      setStage("EXAM");
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 p-3 sm:p-8 font-sans antialiased relative selection:bg-rose-500/30">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* ================= BANNER DE MÓDULO JURÍDICO PARA OUTRAS CARREIRAS ================= */}
        {!isLawUser && !bannerDismissed && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <Scale size={18} />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-rose-200 block">
                  Você está acessando o Módulo de Direito (Seu foco atual: {userCareer.split("(")[0].trim()})
                </span>
                <p className="text-slate-400 text-[11px]">
                  Os atalhos de Prova Oral e Jurisprudência ficam ocultos por padrão para concurseiros de outras áreas. Deseja fixá-los na sua barra lateral?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {isPinnedSuccess ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  <Check size={13} /> Fixado no menu!
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isPinning}
                  onClick={handlePinToSidebar}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPinning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>Fixar no Menu Lateral</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar aviso"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ================= HERO HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-linear-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)] shrink-0">
              <Mic size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Simulador de Prova Oral com IA
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 tracking-wider">
                  Voz Ativa
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Treine com a banca examinadora em tempo real: áudio da pergunta, gravação da resposta e rubrica oficial de notas.
              </p>
            </div>
          </div>
        </div>

        {/* ================= 1. SETUP DE CARGO E MATÉRIA ================= */}
        {stage === "SETUP" && (
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gavel size={18} className="text-rose-400" />
                <span>Configure sua Sabatina Oral</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Selecione o cargo pretendido e a disciplina jurídica da banca examinadora.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cargo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Cargo / Carreira
                </label>
                <select
                  value={selectedCargo}
                  onChange={(e) => setSelectedCargo(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm focus:border-rose-500/50 outline-none transition-all"
                >
                  {cargos.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disciplina */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Disciplina da Arguição
                </label>
                <select
                  value={selectedDisciplina}
                  onChange={(e) => setSelectedDisciplina(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm focus:border-rose-500/50 outline-none transition-all"
                >
                  {disciplinas.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tema ou Ponto Específico Opcional */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Ponto Específico ou Tema do Edital (Opcional)
              </label>
              <input
                type="text"
                value={customPonto}
                onChange={(e) => setCustomPonto(e.target.value)}
                placeholder="Ex: Prisão Preventiva, Modulação de Efeitos, Nepotismo (ou deixe em branco para sorteio surpresa)"
                className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm focus:border-rose-500/50 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* Botão de Iniciar */}
            <button
              type="button"
              onClick={handleStartExam}
              disabled={isGeneratingQuestion}
              className="w-full py-4 rounded-2xl bg-linear-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-xl shadow-rose-600/30 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isGeneratingQuestion ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Convocando a Banca Examinadora...</span>
                </>
              ) : (
                <>
                  <Gavel size={18} />
                  <span>Sortear Ponto e Iniciar Sabatina Oral 🎙️</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================= 2. AMBIENTE DE SABATINA ATIVA ================= */}
        {stage === "EXAM" && questionData && (
          <div className="space-y-6 animate-fade-in">
            {/* CARD DA BANCA EXAMINADORA */}
            <div className="rounded-3xl border border-rose-500/30 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-black uppercase text-rose-300 tracking-wider">
                    {questionData.contextoExaminador}
                  </span>
                </div>

                {/* Cronômetro */}
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border font-mono font-bold text-xs ${
                    secondsRemaining <= 30
                      ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                      : "bg-white/5 text-zinc-200 border-white/10"
                  }`}
                >
                  <Clock size={14} />
                  <span>Tempo de Resposta: {formatTimer(secondsRemaining)}</span>
                </div>
              </div>

              {/* Pergunta da Banca */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Ponto Sorteado: {questionData.ponto}
                  </span>

                  {/* Botão Ouvir Pergunta */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlayingExaminerAudio) {
                        stopExaminerAudio();
                      } else {
                        speakExaminerQuestion(questionData.enunciadoExaminador);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {isPlayingExaminerAudio ? (
                      <>
                        <VolumeX size={13} className="text-rose-400" />
                        <span>Pausar Áudio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} className="text-rose-400" />
                        <span>Ouvir Examinador</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 text-sm sm:text-base text-zinc-100 font-serif leading-relaxed">
                  &quot;{questionData.enunciadoExaminador}&quot;
                </div>
              </div>
            </div>

            {/* ÁREA DE RESPOSTA DO CANDIDATO (MICROFONE) */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Mic size={15} className={isRecording ? "text-rose-400 animate-pulse" : "text-zinc-400"} />
                  <span>Sua Resposta Oral (Grave ou Digite)</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                      isRecording
                        ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse"
                        : "bg-white/5 text-zinc-200 border-white/15 hover:bg-white/10"
                    }`}
                  >
                    {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                    <span>{isRecording ? "Pausar Gravação" : "Falar no Microfone 🎙️"}</span>
                  </button>
                </div>
              </div>

              {/* Ondas Sonoras Animadas quando gravando */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-1 h-4 bg-rose-400 rounded-full animate-bounce" />
                  <span className="w-1 h-7 bg-rose-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-10 bg-rose-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:0.45s]" />
                  <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:0.6s]" />
                  <span className="text-xs font-medium text-rose-300 ml-2">
                    Gravando sua fala em tempo real...
                  </span>
                </div>
              )}

              {/* Caixa de Texto / Transcrição */}
              <div className="space-y-2">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Fale com clareza ao microfone. Suas palavras aparecerão aqui em tempo real. Se preferir ou seu ambiente for barulhento, você também pode digitar..."
                  rows={6}
                  className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-rose-500/50 text-white text-xs sm:text-sm leading-relaxed outline-none transition-all resize-y placeholder:text-zinc-600"
                />
              </div>

              {/* Botão de Encerramento da Resposta */}
              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    stopRecording();
                    stopExaminerAudio();
                    setStage("SETUP");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all"
                >
                  Cancelar Sabatina
                </button>

                <button
                  type="button"
                  onClick={handleFinishAnswer}
                  className="px-6 py-3 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs tracking-wide transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Gavel size={16} />
                  <span>Examinador, Concluí Minha Resposta ⚖️</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. AVALIANDO COM A BANCA ================= */}
        {stage === "EVALUATING" && (
          <div className="rounded-3xl border border-rose-500/30 bg-slate-950/80 p-12 shadow-2xl backdrop-blur-2xl text-center space-y-4 animate-fade-in">
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
              <Gavel size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                A Banca Examinadora está deliberando suas notas...
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Examinando dogmática jurídica, menção a artigos de lei, fluidez verbal e postura de oratória.
              </p>
            </div>
            <Loader2 size={24} className="animate-spin text-rose-400 mx-auto" />
          </div>
        )}

        {/* ================= 4. RESULTADO & ESPELHO DA BANCA ================= */}
        {stage === "RESULT" && evaluation && (
          <div className="space-y-6 animate-fade-in">
            {/* CARD DE NOTA E VEREDITO */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-5 ${
                evaluation.isApproved
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : "border-amber-500/40 bg-amber-950/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {evaluation.isApproved ? (
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={22} className="text-amber-400" />
                    )}
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {evaluation.veredito}
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Sabatina oral concluída com registro oficial de desempenho (+100 XP computados).
                  </p>
                </div>

                {/* Score Geral */}
                <div className="flex items-baseline gap-1.5 self-start sm:self-center px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10">
                  <span className="text-3xl font-black text-white">
                    {evaluation.notaGeral.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-400">/ 10,0</span>
                </div>
              </div>

              {/* BARRAS DE NOTAS ESPECÍFICAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Nota Técnica */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300">Domínio Técnico-Jurídico</span>
                    <span className="font-mono font-black text-indigo-300">
                      {evaluation.notaTecnica.toFixed(1)} / 10,0
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, evaluation.notaTecnica * 10)}%` }}
                    />
                  </div>
                </div>

                {/* Nota Oratória */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300">Postura, Dicção & Oratória</span>
                    <span className="font-mono font-black text-rose-300">
                      {evaluation.notaOratoria.toFixed(1)} / 10,0
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, evaluation.notaOratoria * 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PONTOS FORTES E PONTOS A MELHORAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-emerald-500/20 bg-slate-950/60 p-5 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Pontos Positivos na Fala
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {evaluation.pontosFortes.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-amber-500/20 bg-slate-950/60 p-5 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Oportunidades de Melhoria
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {evaluation.pontosMelhoria.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">!</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FEEDBACK CIRÚRGICO DA BANCA */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={15} /> Parecer Técnico-Jurídico
                </span>
                <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {evaluation.feedbackTecnico}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <Mic size={15} /> Parecer de Comunicação e Segurança Oral
                </span>
                <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                  {evaluation.feedbackOratoria}
                </p>
              </div>
            </div>

            {/* ESPELHO DA RESPOSTA NOTA 10 (MODELAGEM COGNITIVA) */}
            <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-300" />
                  <span>Espelho da Resposta Nota 10 (Padrão de Excelência)</span>
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs sm:text-[13px] text-zinc-200 leading-relaxed font-serif whitespace-pre-wrap">
                {evaluation.espelhoNota10}
              </div>
            </div>

            {/* BOTÃO NOVA SABATINA */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setStage("SETUP");
                  setQuestionData(null);
                  setEvaluation(null);
                  setTranscript("");
                }}
                className="px-6 py-3.5 rounded-2xl bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs tracking-wide transition-all shadow-xl shadow-rose-600/20 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Simular Nova Sabatina Oral 🎙️</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
