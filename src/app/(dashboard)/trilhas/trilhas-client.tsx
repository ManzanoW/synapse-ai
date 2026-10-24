"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NEURAL_VOICE_OPTIONS } from "@/hooks/useAudioFlashcards";
import {
  Compass,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plus,
  Clock,
  Layers,
  Target,
  FileSpreadsheet,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Award,
  Flame,
  NotebookPen,
  HelpCircle,
  Play,
  Pause,
  ExternalLink,
  Trash2,
  BookmarkPlus,
  Headphones,
  Printer,
  VolumeX,
  Crown,
  Loader2,
} from "lucide-react";
import {
  createCustomStudyTrailAction,
  toggleTrailLessonCompletionAction,
  setActiveTrailWeekAction,
  saveTrailLessonNotesAction,
  recordLessonFixationQuizAction,
  saveFixationQuizToErrorNotebookAction,
  createFlashcardsFromTrailLessonAction,
  toggleExternalCourseItemAction,
  createExternalCourseAction,
  generateOrReuseTheoryForLessonAction,
  type RichTheoryData,
  type CreateTrailSubjectInput,
} from "@/actions/trail-actions";
import { useGamification } from "@/context/GamificationContext";
import { PageSpotlightBanner, useSpotlight } from "@/components/onboarding/PageSpotlightBanner";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface TrilhasClientProps {
  initialData: {
    user: any;
    activeTrail: any;
    allTrails: any[];
    editalSubjects: any[];
    externalCourses: any[];
    dueFlashcardsCount: number;
    recentErrors?: any[];
  };
}

export function TrilhasClient({ initialData }: TrilhasClientProps) {
  const { refreshStats } = useGamification();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"trilhas" | "cursos">("trilhas");
  const [trail, setTrail] = useState<any>(initialData.activeTrail);
  const [editalSubjects, setEditalSubjects] = useState<any[]>(initialData.editalSubjects || []);
  const [externalCourses, setExternalCourses] = useState<any[]>(initialData.externalCourses || []);
  const [dueFlashcardsCount] = useState<number>(initialData.dueFlashcardsCount || 15);
  const [recentErrors] = useState<any[]>(initialData.recentErrors || []);

  // Semana selecionada na visualização (Ritmo Livre / Self-Paced: aluno navega/adianta sem trava)
  const [selectedWeek, setSelectedWeek] = useState<number>(
    initialData.activeTrail?.currentWeek || 3,
  );

  // Feedback de XP e Sincronização em tempo real
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Estado do Modal Leitor de Teoria Profunda
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSummaryMode, setIsSummaryMode] = useState(false);
  const [showReaderSettings, setShowReaderSettings] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({});
  const [showCognitiveRadar, setShowCognitiveRadar] = useState(false);
  const [showSubjectsDrawer, setShowSubjectsDrawer] = useState(false);
  const [showLivingTheoryTable, setShowLivingTheoryTable] = useState(false);
  const trilhasSpotlight = useSpotlight("synapse_spotlight_trilhas_v1");
  const [lessonNotes, setLessonNotes] = useState<string>("");
  const [notesSaveStatus, setNotesSaveStatus] = useState<string>("✓ Salvo no banco");
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [isPlaylistMode, setIsPlaylistMode] = useState(false);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("pt-BR-FranciscaNeural");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioAbortRef = useRef<boolean>(false);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  // Estado da Questão de Fixação dentro da Aula
  const [quizAnswers, setQuizAnswers] = useState<
    Record<string, { selectedId: string; isCorrect: boolean; savedToNotebook?: boolean }>
  >({});
  const [flashcardsCreatedMap, setFlashcardsCreatedMap] = useState<Record<string, number>>({});
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [isSyncingAITheory, setIsSyncingAITheory] = useState(false);

  // Estado do Paywall / Preview do Plano Synapse Elite 👑
  const [elitePaywall, setElitePaywall] = useState<{
    open: boolean;
    title: string;
    description: string;
    onContinuePreview?: () => void;
  }>({
    open: false,
    title: "",
    description: "",
  });
  const [hasUnlockedElitePreview, setHasUnlockedElitePreview] = useState(false);
  const isUserFree =
    !initialData.user?.planTier || initialData.user?.planTier === "FREE";

  // Timer Pomodoro e Tamanho da Letra embutidos no Leitor de Teoria
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [lessonFontSize, setLessonFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [readingTheme, setReadingTheme] = useState<"dark" | "sepia" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("synapse_reading_theme");
      if (saved === "sepia" || saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  const handleSetReadingTheme = (theme: "dark" | "sepia" | "light") => {
    setReadingTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("synapse_reading_theme", theme);
    }
  };

  // Estado do Wizard de Criação/Customização de Trilha (3 Passos)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardTitle, setWizardTitle] = useState(
    initialData.activeTrail?.title || "Prefeitura Municipal de Santos • Analista de TI",
  );
  const [wizardBanca, setWizardBanca] = useState(initialData.activeTrail?.banca || "IBAM");
  const [wizardRawEdital, setWizardRawEdital] = useState("");
  const [wizardSubjects, setWizardSubjects] = useState<CreateTrailSubjectInput[]>(() => {
    if (initialData.editalSubjects && initialData.editalSubjects.length > 0) {
      return initialData.editalSubjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        level:
          s.weight >= 8.5
            ? "BEGINNER"
            : s.weight <= 6.5
              ? "ADVANCED"
              : ("INTERMEDIATE" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED"),
        topics: s.topics?.map((t: any) => t.title) || [],
      }));
    }
    return [
      { name: "Português", level: "ADVANCED" },
      { name: "Lei Orgânica Municipal", level: "BEGINNER" },
      { name: "Banco de Dados & SQL", level: "INTERMEDIATE" },
      { name: "Segurança da Informação & LGPD", level: "BEGINNER" },
    ];
  });
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectLevel, setNewSubjectLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">(
    "BEGINNER",
  );
  const [wizardDays, setWizardDays] = useState<string[]>([
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb",
  ]);
  const [wizardDailyHours, setWizardDailyHours] = useState<number>(2);
  const [wizardWeekendHours, setWizardWeekendHours] = useState<number>(4);
  const [wizardInstructions, setWizardInstructions] = useState<string>(
    initialData.activeTrail?.customInstructions || "",
  );
  const [isSubmittingWizard, setIsSubmittingWizard] = useState(false);

  // Modal de Cadastro de Curso Externo / PDF
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseProvider, setNewCourseProvider] = useState("Estratégia Concursos");
  const [newCourseSubjectId, setNewCourseSubjectId] = useState<string>("");
  const [newCourseItemsText, setNewCourseItemsText] = useState(
    "PDF 01 • Teoria Base e Questões Comentadas\nPDF 02 • Aprofundamento e Jurisprudência",
  );
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = setInterval(() => {
      setPomodoroSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [pomodoroRunning]);

  // Se o aluno clicou em "📖 Ler Teoria" no Edital (/edital) ou na Dashboard (/dashboard), abre a aula automaticamente
  useEffect(() => {
    const paramTopicId = searchParams?.get("topicId");
    const paramOpen = searchParams?.get("openTheory");
    const lessons: any[] = trail?.lessons || [];
    if (lessons.length === 0) return;

    if (paramTopicId) {
      const matched =
        lessons.find((l) => l.topicId === paramTopicId && l.lessonType === "THEORY") ||
        lessons.find((l) => l.lessonType === "THEORY");
      if (matched) {
        setSelectedWeek(matched.weekNumber || 3);
        setActiveLessonId(matched.id);
        setLessonNotes(matched.studentNotes || "");
        setIsTheoryOpen(true);
      }
    } else if (paramOpen === "1") {
      const firstPendingTheory =
        lessons.find((l) => !l.isCompleted && l.lessonType === "THEORY") ||
        lessons.find((l) => l.lessonType === "THEORY");
      if (firstPendingTheory) {
        setSelectedWeek(firstPendingTheory.weekNumber || 3);
        setActiveLessonId(firstPendingTheory.id);
        setLessonNotes(firstPendingTheory.studentNotes || "");
        setIsTheoryOpen(true);
      }
    }
  }, [searchParams, trail]);

  function showToast(msg: string) {
    setSyncToast(msg);
    setTimeout(() => {
      setSyncToast((current) => (current === msg ? null : current));
    }, 4500);
  }

  const allLessons: any[] = trail?.lessons || [];
  const weekLessons = allLessons.filter((l) => l.weekNumber === selectedWeek);
  const theoryLessonsOfSelectedWeek = weekLessons.filter((l) => l.lessonType === "THEORY");

  const activeLesson =
    allLessons.find((l) => l.id === activeLessonId) ||
    theoryLessonsOfSelectedWeek[0] ||
    allLessons.find((l) => l.lessonType === "THEORY") ||
    null;

  const activeTheoryData: RichTheoryData | null = activeLesson?.theoryData || null;

  useEffect(() => {
    try {
      const savedVoice = localStorage.getItem("synapse_audio_voice");
      if (savedVoice && NEURAL_VOICE_OPTIONS.some((v) => v.voiceURI === savedVoice)) {
        setSelectedVoiceURI(savedVoice);
      }
    } catch {}
  }, []);

  function handleChangeVoice(uri: string) {
    setSelectedVoiceURI(uri);
    try {
      localStorage.setItem("synapse_audio_voice", uri);
    } catch {}
    if (isSpeakingAudio) {
      stopAudioNarration();
    }
  }

  function stopAudioNarration() {
    audioAbortRef.current = true;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAudio(false);
  }

  async function playNeuralChunk(chunkText: string, voiceURI: string): Promise<boolean> {
    const cacheKey = `${voiceURI}::${chunkText}`;
    try {
      let audioUrl = audioCacheRef.current.get(cacheKey);
      if (!audioUrl) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chunkText.slice(0, 2400),
            voice: voiceURI,
          }),
        });
        if (!res.ok) return false;
        const blob = await res.blob();
        audioUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, audioUrl);
      }

      if (audioAbortRef.current) return true;

      return await new Promise<boolean>((resolve) => {
        const audio = new Audio(audioUrl!);
        currentAudioRef.current = audio;
        audio.onended = () => {
          currentAudioRef.current = null;
          resolve(true);
        };
        audio.onerror = () => {
          currentAudioRef.current = null;
          resolve(false);
        };
        audio.play().catch(() => {
          currentAudioRef.current = null;
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  function startWeekPlaylist() {
    if (theoryLessonsOfSelectedWeek.length === 0) {
      showToast("Nenhuma aula teórica nesta semana para reproduzir.");
      return;
    }
    setIsPlaylistMode(true);
    setPlaylistIndex(0);
    const firstLesson = theoryLessonsOfSelectedWeek[0];
    setActiveLessonId(firstLesson.id);
    showToast(`🎧 Iniciando Playlist Hands-Free da Semana ${selectedWeek}...`);
    setTimeout(() => {
      void toggleAudioLesson();
    }, 400);
  }

  function handlePlaylistNext() {
    if (playlistIndex + 1 < theoryLessonsOfSelectedWeek.length) {
      const nextIdx = playlistIndex + 1;
      setPlaylistIndex(nextIdx);
      const nextLesson = theoryLessonsOfSelectedWeek[nextIdx];
      setActiveLessonId(nextLesson.id);
      stopAudioNarration();
      setTimeout(() => {
        void toggleAudioLesson();
      }, 300);
    } else {
      setIsPlaylistMode(false);
      stopAudioNarration();
      showToast("🎉 Fim da Playlist Hands-Free da Semana!");
    }
  }

  function handlePlaylistPrev() {
    if (playlistIndex > 0) {
      const prevIdx = playlistIndex - 1;
      setPlaylistIndex(prevIdx);
      const prevLesson = theoryLessonsOfSelectedWeek[prevIdx];
      setActiveLessonId(prevLesson.id);
      stopAudioNarration();
      setTimeout(() => {
        void toggleAudioLesson();
      }, 300);
    }
  }

  async function toggleAudioLesson() {
    if (typeof window === "undefined" || !activeTheoryData) {
      return;
    }
    if (isSpeakingAudio) {
      stopAudioNarration();
      return;
    }

    audioAbortRef.current = false;
    setIsSpeakingAudio(true);

    // Divide a aula em blocos (<2400 caracteres) para usar o sintetizador neural de estúdio (/api/tts)
    const chunks: string[] = isSummaryMode
      ? [
          `${activeLesson?.title}. Resumo Rápido de Véspera: ${activeTheoryData.summaryPoints.join(". ")}`,
        ]
      : [
          `${activeLesson?.title}. ${activeTheoryData.introLead}`,
          ...activeTheoryData.sections.map(
            (s) => `${s.heading}. ${s.body}. ${s.calloutTitle ? `${s.calloutTitle}: ${s.calloutText}` : ""}`,
          ),
          `Dica de prova e mnemônico: ${activeTheoryData.examTipTitle}. ${activeTheoryData.examTipText}`,
        ];

    let usedFallback = false;
    for (const chunk of chunks) {
      if (audioAbortRef.current) break;
      const ok = await playNeuralChunk(chunk, selectedVoiceURI);
      if (!ok) {
        usedFallback = true;
        break;
      }
    }

    // Fallback nativo caso o usuário esteja no plano gratuito ou offline
    if (usedFallback && !audioAbortRef.current && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const fullText = chunks.join(" ");
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = "pt-BR";
      utterance.rate = 1.08;
      utterance.onend = () => setIsSpeakingAudio(false);
      utterance.onerror = () => setIsSpeakingAudio(false);
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (!audioAbortRef.current) {
      setIsSpeakingAudio(false);
    }
  }

  async function handleSyncOrGenerateLessonTheory(
    forceRegenerateAI = false,
    targetLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  ) {
    if (!activeLesson) return;

    if (isUserFree && !hasUnlockedElitePreview && (activeLesson.weekNumber || 1) > 1) {
      setElitePaywall({
        open: true,
        title: "Gerador Universal & Ajuste de Dificuldade 👑",
        description:
          "No plano Básico você tem degustação da Semana 1. Com o Synapse Elite, você pode alternar a dificuldade entre Base 🌱, Padrão ⚖️ e Hardcore 🔥 (exceções, jurisprudência e pegadinhas pesadas) em qualquer aula!",
        onContinuePreview: () => {
          setHasUnlockedElitePreview(true);
          setElitePaywall((p) => ({ ...p, open: false }));
          void executeTheorySync(forceRegenerateAI, targetLevel);
        },
      });
      return;
    }

    await executeTheorySync(forceRegenerateAI, targetLevel);
  }

  async function executeTheorySync(
    forceRegenerateAI = false,
    targetLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  ) {
    if (!activeLesson) return;
    setIsSyncingAITheory(true);
    try {
      const res = await generateOrReuseTheoryForLessonAction({
        lessonId: activeLesson.id,
        targetLevel,
        forceRegenerateAI,
      });

      if (res.success && res.lesson) {
        setTrail((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            lessons: (prev.lessons || []).map((l: any) =>
              l.id === res.lesson.id
                ? { ...l, level: res.lesson.level, theoryData: res.lesson.theoryData }
                : l,
            ),
          };
        });

        const levelLabel =
          res.level === "ADVANCED"
            ? "Hardcore 🔥"
            : res.level === "INTERMEDIATE"
              ? "Padrão ⚖️"
              : "Base 🌱";

        if (res.source === "CANONICAL_CLUSTER" || res.source === "SEMANTIC_SIMILARITY") {
          showToast(
            `⚡ Nível ${levelLabel}: Teoria reutilizada do Banco Semântico (${res.similarityScore}% compatível • ${res.canonicalKey} • 0 tokens IA!)`,
          );
        } else {
          showToast(
            `✨ Nível ${levelLabel}: Teoria 2.0 sincronizada e indexada em "${res.canonicalKey}"!`,
          );
        }
      }
    } finally {
      setIsSyncingAITheory(false);
    }
  }

  function printLessonApostila() {
    if (typeof window === "undefined" || !activeLesson || !activeTheoryData) return;

    if (isUserFree && !hasUnlockedElitePreview) {
      setElitePaywall({
        open: true,
        title: "Apostila de Bolso A4 Imprimível 🖨️👑",
        description:
          "Transforme qualquer aula da sua trilha em uma Apostila A4 diagramada com Lei Seca grifada, Quadro Comparativo, suas Anotações Pessoais e Questão Comentada. Exclusivo para membros Synapse Elite!",
        onContinuePreview: () => {
          setHasUnlockedElitePreview(true);
          setElitePaywall((p) => ({ ...p, open: false }));
          executePrintApostila();
        },
      });
      return;
    }

    executePrintApostila();
  }

  function executePrintApostila() {
    if (typeof window === "undefined" || !activeLesson || !activeTheoryData) return;

    const printWin = window.open("", "_blank", "width=900,height=800");
    if (!printWin) return;

    const tableHtml = activeTheoryData.tableData
      ? `
        <h3>Quadro Comparativo Esquematizado</h3>
        <table>
          <thead>
            <tr>${activeTheoryData.tableData.headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${activeTheoryData.tableData.rows
              .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
              .join("")}
          </tbody>
        </table>
      `
      : "";

    const notesHtml = lessonNotes.trim()
      ? `<div class="notes-box"><strong>📝 Minhas Anotações Pessoais:</strong><p>${lessonNotes.replace(/\n/g, "<br/>")}</p></div>`
      : "";

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Apostila A4 • ${activeLesson.title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; line-height: 1.55; padding: 32px; max-width: 820px; margin: 0 auto; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
          .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #eef2ff; color: #4338ca; padding: 3px 8px; border-radius: 6px; margin-right: 6px; }
          h1 { font-size: 22px; margin: 8px 0 4px; color: #1e1b4b; }
          h2, h3 { font-size: 16px; color: #1e293b; margin-top: 20px; margin-bottom: 8px; }
          .lead { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; font-weight: 500; margin-bottom: 18px; }
          .callout { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12.5px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 700; }
          .summary-box { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 14px; margin-top: 18px; }
          .notes-box { background: #fffbeb; border: 1px dashed #d97706; border-radius: 8px; padding: 14px; margin-top: 18px; }
          .quiz-box { border: 1px solid #94a3b8; border-radius: 8px; padding: 14px; margin-top: 20px; page-break-inside: avoid; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge">Synapse AI • Apostila de Bolso A4</span>
          <span class="badge">${activeTheoryData.moduleTag}</span>
          <span class="badge">${activeTheoryData.bancaTag}</span>
          <h1>${activeLesson.title}</h1>
        </div>
        <div class="lead">${activeTheoryData.introLead}</div>
        ${activeTheoryData.sections
          .map(
            (s) => `
            <h3>${s.heading}</h3>
            <p>${s.body}</p>
            ${s.calloutTitle ? `<div class="callout"><strong>${s.calloutTitle}:</strong> ${s.calloutText}</div>` : ""}
          `,
          )
          .join("")}
        ${tableHtml}
        <div class="summary-box">
          <strong>⚡ Resumo Rápido de Véspera:</strong>
          <ul>${activeTheoryData.summaryPoints.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>
        ${notesHtml}
        <div class="quiz-box">
          <strong>✍️ Questão de Fixação (${activeTheoryData.fixationQuiz.bancaTag}):</strong>
          <p>${activeTheoryData.fixationQuiz.question}</p>
          ${activeTheoryData.fixationQuiz.options
            .map((o) => `<p style="margin:4px 0;"><strong>${o.id})</strong> ${o.text}</p>`)
            .join("")}
          <hr style="margin:10px 0;border:none;border-top:1px solid #cbd5e1;" />
          <p style="font-size:12px;"><strong>Gabarito Comentado:</strong> ${activeTheoryData.fixationQuiz.explanation}</p>
        </div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // ============================================================================
  // 🧬 MOTOR DE INTELIGÊNCIA COGNITIVA ELITE:
  // 1) Teoria Viva (A Aula que evolui com os erros do aluno)
  // 2) Detector de DNA de Pegadinha + Treino Vacina
  // 3) Detector de Conceitos Gêmeos (Tabela Anti-Confusão Lado a Lado)
  // 4) Alarme de Memória Esfriando + Resgate Relâmpago (1 min)
  // 5) Folha de Véspera A4 100% Pessoal (Zero custo extra de IA)
  // ============================================================================
  const trapDnaProfile = (() => {
    const errors = recentErrors || [];
    let exceptionCount = 0;
    let deadlineCount = 0;
    let twinConceptCount = 0;

    for (const err of errors) {
      const txt = `${err.questionText || ""} ${err.explanation || ""} ${err.errorReason || ""}`.toLowerCase();
      if (txt.includes("salvo") || txt.includes("exceto") || txt.includes("vedado") || txt.includes("regra")) {
        exceptionCount++;
      } else if (txt.includes("prazo") || txt.includes("dias") || txt.includes("anos") || txt.includes("quórum")) {
        deadlineCount++;
      } else {
        twinConceptCount++;
      }
    }

    const total = Math.max(errors.length, 1);
    const activeBanca = trail?.banca || "CEBRASPE";
    const mainSubject = editalSubjects[0]?.name || "Conhecimentos Específicos";

    if (errors.length > 0 && deadlineCount >= exceptionCount && deadlineCount >= twinConceptCount) {
      return {
        patternTitle: "Troca de Prazos, Quóruns & Números Legais",
        incidencePct: Math.min(88, Math.max(58, Math.round((deadlineCount / total) * 100))),
        diagnosis: `Detectamos nos seus erros recentes que a banca ${activeBanca} costuma derrubar você ao trocar prazos (ex: 15 vs 30 dias, dias úteis vs corridos) ou quóruns de aprovação.`,
        vaccineTrigger: "Regra da Vacina: Circule todo número ou prazo no enunciado antes de ler as alternativas.",
        targetSubject: errors[0]?.subject?.name || mainSubject,
      };
    }

    if (errors.length > 0 && twinConceptCount > exceptionCount) {
      return {
        patternTitle: "Confusão entre Conceitos Gêmeos (Alternativas Quase Idênticas)",
        incidencePct: Math.min(85, Math.max(62, Math.round((twinConceptCount / total) * 100))),
        diagnosis: `Seus erros mostram que você domina a matéria geral, mas perde pontos quando a banca ${activeBanca} coloca dois institutos vizinhos na mesma questão.`,
        vaccineTrigger: "Regra da Vacina: Identifique o verbo diferenciador de cada instituto nos Quadros de Conceitos Gêmeos da sua Teoria Viva.",
        targetSubject: errors[0]?.subject?.name || mainSubject,
      };
    }

    return {
      patternTitle: "Inversão de Exceção Legal ('Salvo', 'Exceto' & Restrições)",
      incidencePct: errors.length > 0 ? Math.min(86, Math.max(64, Math.round(((exceptionCount + 1) / total) * 100))) : 72,
      diagnosis: `Padrão dominante mapeado para ${activeBanca}: o examinador afirma como regra absoluta ('sempre', 'em qualquer hipótese') um artigo que possui ressalva expressa ('salvo', 'exceto').`,
      vaccineTrigger: "Regra da Vacina: Desconfie imediatamente de palavras absolutas ('nunca', 'exclusivamente', 'independe') em provas da banca.",
      targetSubject: errors[0]?.subject?.name || mainSubject,
    };
  })();

  const coolingMemoryLesson = (() => {
    const completedTheory = allLessons.filter(
      (l) => l.lessonType === "THEORY" && l.isCompleted,
    );
    const candidate =
      completedTheory[0] ||
      allLessons.find((l) => l.lessonType === "THEORY" && l.weekNumber === 1) ||
      allLessons[0];
    if (!candidate) return null;

    return {
      lesson: candidate,
      subjectName: candidate.subject?.name || "Fundamentos do Edital",
      previousMasteryPct: 89,
      currentEstimatedRetentionPct: 56,
      daysSinceReview: 14,
    };
  })();

  function getLivingTheoryForLesson(lesson: any) {
    if (!lesson) return null;
    const subName = (lesson.subject?.name || lesson.title || "").toLowerCase();

    // Procura erro real do aluno nesta matéria ou tópico
    const matchedError = (recentErrors || []).find((err: any) => {
      if (lesson.topicId && err.topicId === lesson.topicId) return true;
      if (lesson.subjectId && err.subjectId === lesson.subjectId) return true;
      const errSub = (err.subject?.name || "").toLowerCase();
      return Boolean(errSub && subName && (subName.includes(errSub) || errSub.includes(subName)));
    });

    if (matchedError) {
      return {
        isFromRealError: true,
        badge: "🚨 TEORIA VIVA • ADAPTADA AO SEU ERRO REAL",
        alertTitle: `Atenção: Você já tropeçou neste tema em bateria recente!`,
        errorSnippet:
          matchedError.questionText?.length > 160
            ? `${matchedError.questionText.slice(0, 160)}...`
            : matchedError.questionText,
        twinConceptLeftTitle: `❌ O que atraiu você (${matchedError.userAnswer || "Alternativa Marcada"})`,
        twinConceptLeftBody:
          "Distrator clássico da banca que mistura a regra geral com uma exceção ou inverte o sujeito competente.",
        twinConceptRightTitle: `✅ Regra Exata da Banca (${matchedError.correctAnswer || "Gabarito Oficial"})`,
        twinConceptRightBody:
          matchedError.explanation ||
          "Observe a literalidade da norma e a palavra-chave restritiva destacada no quadro comparativo abaixo.",
        differentiatorKeyword:
          "Palavra-Chave de Desempate: Cheque sempre se o caso exige autorização judicial/legal expressa ou se é autoaplicável.",
      };
    }

    // Quadro de Conceitos Gêmeos preventivo calibrado pelo tema da aula
    if (subName.includes("sql") || subName.includes("dados") || subName.includes("normal")) {
      return {
        isFromRealError: false,
        badge: "⚖️ DETECTOR DE CONCEITOS GÊMEOS (ANTI-CONFUSÃO)",
        alertTitle: "Campeão de Troca na Hora da Prova: WHERE vs. HAVING & 2FN vs. 3FN",
        errorSnippet:
          "82% dos candidatos erram quando a banca mistura filtro de linha individual com filtro de função agregada ou dependência parcial com transitiva.",
        twinConceptLeftTitle: "❌ Conceito Gêmeo A: WHERE / 2ª Forma Normal (2FN)",
        twinConceptLeftBody:
          "WHERE filtra linhas ANTES do GROUP BY (não aceita COUNT/SUM). Já a 2FN elimina dependência funcional PARCIAL (atributo depende só de parte da chave composta).",
        twinConceptRightTitle: "✅ Conceito Gêmeo B: HAVING / 3ª Forma Normal (3FN)",
        twinConceptRightBody:
          "HAVING filtra grupos DEPOIS do GROUP BY (exige função agregada). Já a 3FN elimina dependência TRANSITIVA (atributo não-chave depende de outro atributo não-chave).",
        differentiatorKeyword:
          "Gatilho de 1 Segundo: 'Parcial = 2FN (Parte da PK)' | 'Transitiva = 3FN (Carona em coluna comum)'.",
      };
    }

    if (subName.includes("portugu") || subName.includes("sintaxe")) {
      return {
        isFromRealError: false,
        badge: "⚖️ DETECTOR DE CONCEITOS GÊMEOS (ANTI-CONFUSÃO)",
        alertTitle: "Campeão de Troca na Hora da Prova: Adjunto Adnominal vs. Complemento Nominal",
        errorSnippet:
          "As bancas colocam um termo com preposição 'DE' ligado a um substantivo abstrato e pedem a função sintática.",
        twinConceptLeftTitle: "❌ Conceito Gêmeo A: Adjunto Adnominal (Agente / Posse)",
        twinConceptLeftBody:
          "Pratica a ação ou indica posse. Ex: 'A resposta DO ALUNO foi rápida' (o aluno respondeu = Agente).",
        twinConceptRightTitle: "✅ Conceito Gêmeo B: Complemento Nominal (Paciente / Alvo)",
        twinConceptRightBody:
          "Sofre a ação (sentido passivo). Ex: 'A leitura DO EDITAL é essencial' (o edital é lido = Paciente).",
        differentiatorKeyword:
          "Gatilho de 1 Segundo: Tente passar para a voz passiva. Se sofrer a ação, é Complemento Nominal!",
      };
    }

    return {
      isFromRealError: false,
      badge: "⚖️ DETECTOR DE CONCEITOS GÊMEOS (ANTI-CONFUSÃO)",
      alertTitle: "Nunca Mais Confunda: Regra Vinculada ('Deverá') vs. Discricionária ('Poderá')",
      errorSnippet:
        "A pegadinha nº 1 da banca neste tópico é trocar uma obrigação legal taxativa por uma faculdade da administração (ou vice-versa).",
      twinConceptLeftTitle: "❌ Armadilha da Banca: 'A critério / Poderá / Sempre'",
      twinConceptLeftBody:
        "O examinador insere margem de escolha onde a lei determina ato vinculado ou prazo improrrogável.",
      twinConceptRightTitle: "✅ Regra Blindada: Literalidade + Exceção ('Salvo')",
      twinConceptRightBody:
        "Memorize o verbo exato do dispositivo legal e verifique se o prazo admite prorrogação motivada.",
      differentiatorKeyword:
        "Gatilho de 1 Segundo: Grife o verbo nuclear do artigo ('deverá' vs 'poderá') antes de julgar a assertiva.",
    };
  }

  function printPersonalEveSheetA4() {
    if (isUserFree && !hasUnlockedElitePreview) {
      setElitePaywall({
        open: true,
        title: "Folha de Véspera A4 100% Pessoal (Synapse Elite 👑)",
        description:
          "Compile em 1 clique um caderno A4 imprimível cruzando seu DNA de Pegadinha, os Quadros de Conceitos Gêmeos dos seus erros e os Resumos de Véspera da sua Trilha.",
        onContinuePreview: () => printPersonalEveSheetA4(),
      });
      return;
    }

    const printWin = window.open("", "_blank", "width=940,height=840");
    if (!printWin) {
      showToast("⚠️ Permita pop-ups no navegador para abrir sua Folha de Véspera A4.");
      return;
    }

    const lessonsToCompile = theoryLessonsOfSelectedWeek.length > 0
      ? theoryLessonsOfSelectedWeek
      : allLessons.filter((l) => l.lessonType === "THEORY").slice(0, 4);

    const lessonsHtml = lessonsToCompile
      .map((l: any, idx: number) => {
        const th: RichTheoryData | null = l.theoryData || null;
        const liv = getLivingTheoryForLesson(l);
        const summaryPoints = th?.summaryPoints || [
          "Domine a literalidade da norma e circule ressalvas expressas ('salvo', 'exceto').",
          "Compare os verbos nucleares de cada instituto no Quadro Anti-Confusão acima.",
        ];
        const mnemonic =
          th?.fixationQuiz?.mnemonic ||
          "Pense no verbo diferenciador antes de marcar a alternativa.";
        return `
          <div class="lesson-block">
            <h2>${idx + 1}. ${l.title} (${th?.bancaTag || trail?.banca || "Oficial"})</h2>
            ${
              liv
                ? `<div class="twin-box">
                    <div class="twin-title">${liv.badge}: ${liv.alertTitle}</div>
                    <table class="twin-table">
                      <tr>
                        <th style="width:50%;background:#fff1f2;color:#9f1239;">${liv.twinConceptLeftTitle}</th>
                        <th style="width:50%;background:#ecfdf5;color:#065f46;">${liv.twinConceptRightTitle}</th>
                      </tr>
                      <tr>
                        <td>${liv.twinConceptLeftBody}</td>
                        <td>${liv.twinConceptRightBody}</td>
                      </tr>
                    </table>
                    <div style="font-size:11px;margin-top:6px;font-weight:bold;color:#4338ca;">⚡ ${liv.differentiatorKeyword}</div>
                  </div>`
                : ""
            }
            <div class="summary-list">
              <strong>🎯 Pontos-Chave de Véspera:</strong>
              <ul>
                ${summaryPoints.map((pt: string) => `<li>${pt}</li>`).join("")}
              </ul>
              <p style="font-size:11px;margin-top:6px;color:#0f172a;"><strong>🧠 Mnemônico de Prova:</strong> ${mnemonic}</p>
            </div>
          </div>
        `;
      })
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Folha de Véspera A4 Pessoal — ${trail?.title || "Synapse Elite"}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; line-height: 1.5; font-size: 12px; }
          .header { border-bottom: 3px solid #f59e0b; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
          .badge { background: #fef3c7; color: #92400e; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
          h1 { font-size: 19px; margin: 4px 0 0 0; color: #0f172a; }
          .dna-box { background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
          .lesson-block { margin-bottom: 18px; page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          h2 { font-size: 14px; color: #312e81; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .twin-box { margin-bottom: 10px; }
          .twin-title { font-size: 11px; font-weight: 800; color: #be123c; margin-bottom: 4px; }
          .twin-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .twin-table th, .twin-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
          .summary-list { background: #f8fafc; padding: 8px 12px; border-radius: 6px; }
          ul { margin: 4px 0; padding-left: 18px; }
          li { margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <span class="badge">👑 Folha de Véspera A4 100% Pessoal • Synapse Elite</span>
            <h1>${trail?.title || "Caderno de Ouro Personalizado"} (Semana ${selectedWeek})</h1>
          </div>
          <div style="font-size:11px;color:#64748b;">Banca: <strong>${trail?.banca || "Oficial"}</strong></div>
        </div>

        <div class="dna-box">
          <div style="font-weight:800;font-size:13px;color:#92400e;">🕵️‍♂️ SEU DNA DE PEGADINHA (${trapDnaProfile.incidencePct}% de incidência): ${trapDnaProfile.patternTitle}</div>
          <p style="margin:4px 0;">${trapDnaProfile.diagnosis}</p>
          <div style="font-weight:700;color:#b45309;">💉 ${trapDnaProfile.vaccineTrigger}</div>
        </div>

        ${lessonsHtml}

        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // Cálculo de progresso geral e por semana
  const totalTrailLessons = allLessons.length || 1;
  const completedTrailLessons = allLessons.filter((l) => l.isCompleted).length;
  const overallProgressPct = Math.round((completedTrailLessons / totalTrailLessons) * 100);

  function getWeekStats(weekNum: number) {
    const list = allLessons.filter((l) => l.weekNumber === weekNum);
    if (list.length === 0) {
      return { done: 0, total: 3, pct: 0, isAllDone: false };
    }
    const done = list.filter((l) => l.isCompleted).length;
    const total = list.length;
    // Para semanas anteriores já concluídas (1 e 2) ou semana 3 com dias anteriores (Seg, Ter, Qua = 9 metas)
    if (weekNum < 3 && done === total) {
      return { done: 12, total: 12, pct: 100, isAllDone: true };
    }
    if (weekNum === 3 && total === 3) {
      const virtualDone = 9 + done;
      const pct = Math.round((virtualDone / 12) * 100);
      return { done: virtualDone, total: 12, pct, isAllDone: done === total };
    }
    const pct = Math.round((done / total) * 100);
    return { done, total, pct, isAllDone: done === total };
  }

  const currentWeekStats = getWeekStats(selectedWeek);

  function openTheoryModalForLesson(lessonId?: string) {
    // Sempre abre na Aula 1 por padrão se nenhum ID específico for passado
    const targetLesson =
      (lessonId && allLessons.find((l) => l.id === lessonId)) ||
      theoryLessonsOfSelectedWeek[0] ||
      allLessons.find((l) => l.lessonType === "THEORY");

    if (!targetLesson) return;

    stopAudioNarration();
    setActiveLessonId(targetLesson.id);
    setLessonNotes(targetLesson.studentNotes || "");
    setIsSummaryMode(false);
    setOpenFaqIndices({});
    setIsTheoryOpen(true);
  }

  async function handleToggleLesson(lesson: any, nextCompleted: boolean) {
    triggerHaptic(nextCompleted ? "success" : "light");
    // Atualização otimista imediata na UI
    setTrail((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        lessons: prev.lessons.map((l: any) =>
          l.id === lesson.id ? { ...l, isCompleted: nextCompleted } : l,
        ),
      };
    });

    const res = await toggleTrailLessonCompletionAction({
      lessonId: lesson.id,
      completed: nextCompleted,
      studyMinutes: lesson.estimatedMinutes || 25,
    });

    if (res.success && nextCompleted) {
      refreshStats?.();
      if (res.data?.weekCompletedBonus) {
        showToast(
          `🎉 Semana ${lesson.weekNumber} Concluída! +${res.data.xpAwarded} XP • Edital e Cronograma sincronizados!`,
        );
      } else {
        showToast(
          `✓ Meta concluída! +${res.data?.xpAwarded || 40} XP • Tópico atualizado no Edital e Cronograma!`,
        );
      }
    }
  }

  async function handleCompleteAndAdvanceInModal() {
    if (!activeLesson) return;

    if (!activeLesson.isCompleted) {
      await handleToggleLesson(activeLesson, true);
    }

    // Procura a próxima aula teórica da mesma semana
    const currentIdx = theoryLessonsOfSelectedWeek.findIndex((l) => l.id === activeLesson.id);
    if (currentIdx !== -1 && currentIdx + 1 < theoryLessonsOfSelectedWeek.length) {
      const nextLesson = theoryLessonsOfSelectedWeek[currentIdx + 1];
      setActiveLessonId(nextLesson.id);
      setLessonNotes(nextLesson.studentNotes || "");
      setIsSummaryMode(false);
      setOpenFaqIndices({});
    } else {
      setIsTheoryOpen(false);
    }
  }

  async function handleSelectWeek(weekNum: number) {
    triggerHaptic("light");
    setSelectedWeek(weekNum);
    if (trail?.id) {
      setTrail((prev: any) => (prev ? { ...prev, currentWeek: weekNum } : prev));
      await setActiveTrailWeekAction({ trailId: trail.id, weekNumber: weekNum });
    }
  }

  async function handleNotesChange(val: string) {
    setLessonNotes(val);
    if (!activeLesson) return;

    setTrail((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        lessons: prev.lessons.map((l: any) =>
          l.id === activeLesson.id ? { ...l, studentNotes: val } : l,
        ),
      };
    });

    setNotesSaveStatus("Salvando...");
    await saveTrailLessonNotesAction({ lessonId: activeLesson.id, notes: val });
    setNotesSaveStatus("✓ Salvo no banco");
  }

  async function handleAnswerFixationQuiz(optionId: string) {
    if (!activeLesson || !activeTheoryData) return;
    const isCorrect = optionId === activeTheoryData.fixationQuiz.correctOptionId;
    triggerHaptic(isCorrect ? "success" : "warning");

    setQuizAnswers((prev) => ({
      ...prev,
      [activeLesson.id]: {
        selectedId: optionId,
        isCorrect,
        savedToNotebook: prev[activeLesson.id]?.savedToNotebook || false,
      },
    }));

    const res = await recordLessonFixationQuizAction({
      lessonId: activeLesson.id,
      isCorrect,
    });

    if (res.success) {
      if (isCorrect) {
        refreshStats?.();
      }
      if (res.autoLevelUp?.triggered) {
        if (
          res.autoLevelUp.direction === "UP" &&
          res.autoLevelUp.updatedLessonIds.length > 0
        ) {
          const idSet = new Set(res.autoLevelUp.updatedLessonIds);
          const nextLvl = res.autoLevelUp.newLevel;
          setTrail((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              lessons: prev.lessons.map((l: any) =>
                idSet.has(l.id) ? { ...l, level: nextLvl } : l,
              ),
            };
          });
        }
        showToast(res.autoLevelUp.message);
      } else if (isCorrect) {
        showToast("🎯 Resposta Correta! +15 XP • Performance do tópico atualizada no Edital!");
      }
    }
  }

  async function handleSaveQuizToErrorNotebook() {
    if (!activeLesson) return;
    const currentAns = quizAnswers[activeLesson.id];
    if (!currentAns || currentAns.savedToNotebook) return;

    const res = await saveFixationQuizToErrorNotebookAction({
      lessonId: activeLesson.id,
      userAnswer: currentAns.selectedId,
    });

    if (res.success) {
      setQuizAnswers((prev) => ({
        ...prev,
        [activeLesson.id]: {
          ...prev[activeLesson.id],
          savedToNotebook: true,
        },
      }));
      showToast("📓 Questão salva no seu Caderno de Erros (/notebook) para revisão futura!");
    }
  }

  async function handleCreateFlashcardsFromLesson() {
    if (!activeLesson || isGeneratingCards) return;
    setIsGeneratingCards(true);
    const res = await createFlashcardsFromTrailLessonAction({ lessonId: activeLesson.id });
    setIsGeneratingCards(false);

    if (res.success) {
      setFlashcardsCreatedMap((prev) => ({
        ...prev,
        [activeLesson.id]: res.count || 3,
      }));
      showToast(
        `🎴 ${res.count} Cartões adicionados ao baralho "${res.deckTitle}" nos seus Cartões de Memória!`,
      );
    }
  }

  function handleExtractFromRawEdital() {
    const raw = wizardRawEdital.trim();
    if (!raw) return;

    const parts = raw
      .split(/[\n;•]+/)
      .map((s) => s.replace(/^\d+[\.\-\)]\s*/, "").trim())
      .filter((s) => s.length > 2);

    const extracted: CreateTrailSubjectInput[] = [];
    for (const part of parts.slice(0, 8)) {
      const colonIdx = part.indexOf(":");
      const name = colonIdx !== -1 ? part.slice(0, colonIdx).trim() : part.slice(0, 42).trim();
      const topicsStr = colonIdx !== -1 ? part.slice(colonIdx + 1).trim() : "";
      const topics = topicsStr
        ? topicsStr
            .split(/[,\.]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const lower = name.toLowerCase();
      const level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" =
        lower.includes("portugu") ? "ADVANCED" : lower.includes("lei") ? "BEGINNER" : "INTERMEDIATE";

      extracted.push({ name, level, topics });
    }

    if (extracted.length > 0) {
      setWizardSubjects(extracted);
      setWizardStep(2);
    }
  }

  async function handleCreateCustomTrail() {
    if (wizardSubjects.length === 0 || isSubmittingWizard) return;
    setIsSubmittingWizard(true);

    const res = await createCustomStudyTrailAction({
      title: wizardTitle,
      banca: wizardBanca,
      subjects: wizardSubjects,
      studyDays: wizardDays,
      dailyHours: wizardDailyHours,
      weekendHours: wizardWeekendHours,
      customInstructions: wizardInstructions,
    });

    setIsSubmittingWizard(false);

    if (res.success && res.data) {
      setTrail(res.data);
      setSelectedWeek(1);
      setIsWizardOpen(false);
      showToast(
        "🚀 Nova Trilha criada e sincronizada automaticamente com seu Edital Verticalizado e Cronograma!",
      );
    }
  }

  async function handleToggleExternalCourseItem(courseId: string, item: any) {
    const nextDone = !item.isCompleted;
    setExternalCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              items: c.items.map((it: any) =>
                it.id === item.id ? { ...it, isCompleted: nextDone } : it,
              ),
            }
          : c,
      ),
    );

    const res = await toggleExternalCourseItemAction({
      itemId: item.id,
      completed: nextDone,
    });

    if (res.success && nextDone) {
      refreshStats?.();
      showToast("📚 Material concluído! +30 XP • Tópico sincronizado no Edital Verticalizado!");
    }
  }

  async function handleCreateNewExternalCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourseTitle.trim() || isCreatingCourse) return;
    setIsCreatingCourse(true);

    const lines = newCourseItemsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const items = lines.map((line) => ({
      title: line,
      itemType: (line.toLowerCase().includes("vídeo") || line.toLowerCase().includes("video")
        ? "VIDEO"
        : "PDF") as "PDF" | "VIDEO",
      estimatedMinutes: 45,
    }));

    const res = await createExternalCourseAction({
      title: newCourseTitle,
      provider: newCourseProvider,
      subjectId: newCourseSubjectId || undefined,
      items: items.length > 0 ? items : [{ title: "Módulo 01 • Teoria e Questões", itemType: "PDF", estimatedMinutes: 45 }],
    });

    setIsCreatingCourse(false);
    if (res.success && res.data) {
      setExternalCourses((prev) => [res.data, ...prev]);
      setNewCourseTitle("");
      setIsNewCourseModalOpen(false);
      showToast("📚 Curso externo cadastrado e vinculado ao seu Edital!");
    }
  }

  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast de Sincronização em Tempo Real */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl shadow-emerald-950/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* CABEÇALHO ENXUTO DO MÓDULO */}
      <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Trilhas de Aprendizado & Cursos</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Passo a passo mastigado para a sua prova. Clique na aula do dia para ler a explicação ou ouvir em áudio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Ajuda Rápida para iniciantes */}
            <button
              type="button"
              onClick={trilhasSpotlight.toggle}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ver explicação rápida de como estudar nesta tela"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Como funciona?</span>
            </button>

            {/* Seletor de Abas Principais */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("trilhas")}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "trilhas"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Minha Trilha</span>
              </button>
              <button
                onClick={() => setActiveTab("cursos")}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "cursos"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cursos Externos ({externalCourses.length})</span>
              </button>
            </div>

            {activeTab === "trilhas" ? (
              <button
                onClick={() => {
                  setWizardStep(1);
                  setIsWizardOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Trocar / Criar Trilha</span>
              </button>
            ) : (
              <button
                onClick={() => setIsNewCourseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cadastrar Curso / PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* GUIA PASSO A PASSO PARA INICIANTES (APARECE NO 1º ACESSO OU AO CLICAR EM "COMO FUNCIONA?") */}
        <PageSpotlightBanner
          storageKey="synapse_spotlight_trilhas_v1"
          externalIsOpen={trilhasSpotlight.isOpen}
          onClose={trilhasSpotlight.dismiss}
          badgeText="👋 Guia Rápido (Sem Complicação)"
          title="Como estudar pela sua Trilha em 3 passos simples:"
          description="Você não precisa configurar nada complicado. Basta seguir a ordem das aulas da sua semana:"
          accentColor="indigo"
          primaryActionLabel="Entendi! Vamos começar"
          steps={[
            {
              icon: <Play className="w-4 h-4" />,
              title: "1. Clique em 'Começar Aula'",
              description:
                "Abra a primeira aula marcada com 'COMECE POR AQUI HOJE'. Você pode ler o resumo mastigado ou clicar em 'Ouvir Aula' para escutar como um podcast.",
              tag: "Leitura ou Áudio",
            },
            {
              icon: <Target className="w-4 h-4" />,
              title: "2. Responda a Pergunta no Final",
              description:
                "Ao final de cada aula há 1 questão rápida no estilo da sua banca para você testar se entendeu a matéria.",
              tag: "Teste Rápido",
            },
            {
              icon: <CheckCircle2 className="w-4 h-4" />,
              title: "3. Conclua e Avance no Seu Ritmo",
              description:
                "Terminou a aula? Clique em 'Concluir e Ir para a Próxima'. O sistema marca seu Edital e soma seus pontos automaticamente!",
              tag: "100% Automático",
            },
          ]}
        />

        {/* =========================================================
            ABA 1: MINHA TRILHA ATIVA & TEORIAS (HIERARQUIA LIMPA)
           ========================================================= */}
        {activeTab === "trilhas" && trail && (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-5">
            {/* CONTINUAR DE ONDE PAROU (AÇÃO DIRETA EM 1 CLIQUE) */}
            {(() => {
              const nextLessonToStudy =
                allLessons.find((l: any) => !l.isCompleted && l.lessonType === "THEORY") ||
                allLessons.find((l: any) => !l.isCompleted) ||
                allLessons[0];

              if (!nextLessonToStudy) return null;

              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 fill-indigo-400 ml-0.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          CONTINUAR DE ONDE PAROU
                        </span>
                        <span className="text-xs text-slate-400">
                          Semana {nextLessonToStudy.weekNumber}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                        {nextLessonToStudy.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {nextLessonToStudy.subjectName || "Teoria & Resumo da Semana"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTheoryModalForLesson(nextLessonToStudy.id)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Continuar Aula</span>
                  </button>
                </div>
              );
            })()}
            {/* 1. CABEÇALHO COMPACTO DA TRILHA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-sm shrink-0">
                  {trail.banca?.slice(0, 4)?.toUpperCase() || "TRL"}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white">{trail.title}</h2>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase">
                      Banca {trail.banca}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editalSubjects.length} matérias do Edital • Meta sugerida: {trail.dailyHours || 2}h por dia
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const nextTheory =
                      theoryLessonsOfSelectedWeek.find((l) => !l.isCompleted) ||
                      theoryLessonsOfSelectedWeek[0];
                    openTheoryModalForLesson(nextTheory?.id);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Continuar Minha Próxima Aula</span>
                </button>

                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Seu Progresso</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {overallProgressPct}% concluído
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 flex items-center justify-center font-mono text-[11px] font-black text-white">
                    {overallProgressPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SELETOR ENXUTO DE SEMANAS (TABS COMPACTAS) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Escolha a semana que deseja estudar (você pode adiantar qualquer semana):</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((weekNum) => {
                  const st = getWeekStats(weekNum);
                  const isSelected = selectedWeek === weekNum;
                  const weekLessonsList = allLessons.filter((l) => l.weekNumber === weekNum);
                  const mainTitle =
                    weekLessonsList[0]?.subject?.name ||
                    (weekNum === 1
                      ? "Português & Sintaxe"
                      : weekNum === 2
                        ? "Fundamentos de SQL"
                        : weekNum === 3
                          ? "Lei Orgânica + Formas Normais"
                          : "Segurança, LGPD & Simulado");

                  return (
                    <button
                      type="button"
                      key={weekNum}
                      onClick={() => handleSelectWeek(weekNum)}
                      className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-950/60 border-2 border-indigo-500 shadow-md shadow-indigo-600/10"
                          : st.isAllDone
                            ? "bg-emerald-950/15 border border-emerald-500/30 hover:border-emerald-500/50"
                            : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-mono font-bold ${
                            isSelected
                              ? "text-indigo-300"
                              : st.isAllDone
                                ? "text-emerald-400"
                                : "text-slate-400"
                          }`}
                        >
                          Semana {weekNum} {isSelected ? "• Aberta" : ""}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-300">
                          {st.pct}%
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white line-clamp-1 mt-1">
                        {mainTitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. METAS E AULAS DA SEMANA SELECIONADA (FOCO PRINCIPAL IMEDIATO) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/90 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="text-xs font-bold text-white">
                    📋 Seu Roteiro de Estudo da Semana {selectedWeek}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                    {currentWeekStats.done} de {currentWeekStats.total} tarefas prontas
                  </span>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={startWeekPlaylist}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Ouvir todas as aulas da semana em sequência (Hands-Free para trânsito/treino)"
                    >
                      <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                      <span>🎧 Playlist Hands-Free</span>
                    </button>

                    <button
                      type="button"
                      onClick={printPersonalEveSheetA4}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Exportar Folha de Véspera A4 Imprimível desta Semana"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>📄 Folha de Véspera A4</span>
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  Dica: Clique no botão azul da próxima aula para estudar
                </span>
              </div>

              {/* Lista de Metas / Aulas */}
              <div className="space-y-2.5">
                {(() => {
                  const firstPendingIdx = weekLessons.findIndex((l: any) => !l.isCompleted);
                  return weekLessons.map((lesson: any, idx: number) => {
                    const isTheory = lesson.lessonType === "THEORY";
                    const isFlashcard = lesson.lessonType === "FLASHCARDS";
                    const isSimulado = lesson.lessonType === "SIMULADO";
                    const isNextUp = idx === firstPendingIdx;

                    // Identifica disciplina, tópico e banca vinculados à aula/simulado
                    const relatedSubject =
                      lesson.subject ||
                      (lesson.subjectId ? editalSubjects.find((s: any) => s.id === lesson.subjectId) : null) ||
                      theoryLessonsOfSelectedWeek[0]?.subject ||
                      (theoryLessonsOfSelectedWeek[0]?.subjectId
                        ? editalSubjects.find((s: any) => s.id === theoryLessonsOfSelectedWeek[0].subjectId)
                        : null) ||
                      null;

                    const relatedSubjectName = relatedSubject?.name || "";
                    const relatedSubjectId = relatedSubject?.id || lesson.subjectId || "";

                    const relatedTopic =
                      lesson.topic ||
                      (lesson.topicId && relatedSubject
                        ? relatedSubject.topics?.find((t: any) => t.id === lesson.topicId)
                        : null) ||
                      theoryLessonsOfSelectedWeek[0]?.topic ||
                      (theoryLessonsOfSelectedWeek[0]?.topicId && relatedSubject
                        ? relatedSubject.topics?.find((t: any) => t.id === theoryLessonsOfSelectedWeek[0].topicId)
                        : null) ||
                      null;

                    const relatedTopicTitle = relatedTopic?.title || "";
                    const relatedTopicId = relatedTopic?.id || lesson.topicId || "";

                    const trailBanca = trail?.banca || "IBAM";
                    const matchedQtd = lesson.title?.match(/(\d+)\s*quest/i);
                    const questionsCount = matchedQtd ? matchedQtd[1] : "20";

                    const questionsUrl =
                      `/questions?banca=${encodeURIComponent(trailBanca)}` +
                      (relatedSubjectId ? `&subjectId=${encodeURIComponent(relatedSubjectId)}` : "") +
                      (relatedSubjectName ? `&subject=${encodeURIComponent(relatedSubjectName)}` : "") +
                      (relatedTopicId ? `&topicId=${encodeURIComponent(relatedTopicId)}` : "") +
                      (relatedTopicTitle ? `&topic=${encodeURIComponent(relatedTopicTitle)}` : "") +
                      `&qtd=${questionsCount}&trailLessonId=${encodeURIComponent(lesson.id)}&autoStart=1`;

                    const flashcardsUrl = relatedSubjectName
                      ? `/flashcards/decks?subject=${encodeURIComponent(relatedSubjectName)}&trailLessonId=${encodeURIComponent(lesson.id)}`
                      : `/flashcards?trailLessonId=${encodeURIComponent(lesson.id)}`;

                    // Traduz títulos técnicos de FSRS para linguagem humana
                    const friendlyTitle = (lesson.title || "")
                      .replace(/Revisão Diária FSRS:\s*Flashcards de/i, "Cartões de Memorização:")
                      .replace(/\bFSRS\b/g, "Memorização");

                    return (
                      <div
                        key={lesson.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                          isNextUp
                            ? "bg-indigo-950/35 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                            : "bg-slate-950/80 border-slate-800/90 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            title="Marcar tarefa como concluída"
                            checked={Boolean(lesson.isCompleted)}
                            onChange={(e) => handleToggleLesson(lesson, e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {isNextUp && (
                                <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[9px] font-extrabold uppercase tracking-wide">
                                  👉 Comece por aqui hoje
                                </span>
                              )}
                              <span
                                className={`font-bold ${
                                  lesson.isCompleted
                                    ? "text-slate-400 line-through"
                                    : "text-white"
                                }`}
                              >
                                {friendlyTitle}
                              </span>
                            </div>
                            <span className="block text-[11px] text-slate-400 mt-0.5">
                              {isFlashcard
                                ? "Perguntas e respostas rápidas para não esquecer a matéria"
                                : lesson.subtitle || "Resumo explicado + 1 pergunta de teste no final"}{" "}
                              • ~{lesson.estimatedMinutes || 25} minutos
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {lesson.isCompleted && (
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                              ✓ Concluída
                            </span>
                          )}

                          {isTheory && (
                            <button
                              onClick={() => openTheoryModalForLesson(lesson.id)}
                              className={`px-3.5 py-2 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all ${
                                isNextUp
                                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                              }`}
                            >
                              <span>
                                📖{" "}
                                {lesson.isCompleted
                                  ? "Ler Aula Novamente"
                                  : isNextUp
                                    ? `Começar Aula ${idx + 1} Agora`
                                    : `Abrir Aula ${idx + 1}`}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isFlashcard && (
                            <Link
                              href={flashcardsUrl}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Praticar Cartões de Memória</span>
                            </Link>
                          )}

                          {isSimulado && (
                            <Link
                              href={questionsUrl}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span>Fazer Questões da Banca</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* BANNER DE DESBLOQUEIO IMEDIATO DA PRÓXIMA SEMANA */}
              {currentWeekStats.isAllDone && selectedWeek < 4 && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-200">
                    <strong className="text-emerald-300">🎉 Semana {selectedWeek} concluída!</strong>{" "}
                    Você já pode passar para a Semana {selectedWeek + 1} sem precisar esperar.
                  </div>
                  <button
                    onClick={() => handleSelectWeek(selectedWeek + 1)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs whitespace-nowrap cursor-pointer transition-all"
                  >
                    Ir para Semana {selectedWeek + 1} →
                  </button>
                </div>
              )}
            </div>

            {/* 4. BARRA DE FERRAMENTAS EXTRAS DO ALUNO (LINGUAGEM SIMPLES E RECOLHÍVEL) */}
            <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 overflow-hidden">
              <div className="p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-extrabold uppercase">
                    👑 Ajuda Inteligente
                  </span>
                  <span className="text-slate-200 font-semibold">
                    Ponto de atenção nas suas questões:{" "}
                    <strong className="text-rose-300">{trapDnaProfile.patternTitle.split("(")[0]}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {coolingMemoryLesson && (
                    <button
                      type="button"
                      onClick={() => {
                        openTheoryModalForLesson(coolingMemoryLesson.lesson.id);
                        setIsSummaryMode(true);
                        showToast(
                          "⚡ Revisão de 1 Minuto aberta! Leia os pontos principais e responda a pergunta no final.",
                        );
                      }}
                      title="Abre o resumo rápido de uma aula antiga para você relembrar em 1 minuto"
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition-all cursor-pointer"
                    >
                      ⚡ Revisar Aula Antiga em 1 Min
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCognitiveRadar((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {showCognitiveRadar ? "Fechar Dicas ▴" : "Ver Dicas Personalizadas ▾"}
                  </button>
                </div>
              </div>

              {showCognitiveRadar && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/90 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Card 1: O que você mais erra */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-rose-500/25 flex flex-col justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-rose-400">
                          🕵️‍♂️ Onde a Banca Mais Te Derruba
                        </span>
                        <span className="text-[10px] font-mono font-bold text-rose-300">
                          {trapDnaProfile.incidencePct}% dos seus erros
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">
                        {trapDnaProfile.patternTitle}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {trapDnaProfile.diagnosis}
                      </p>
                      <div className="p-2 rounded-lg bg-amber-950/25 border border-amber-500/20 text-[11px] text-amber-200">
                        💡 {trapDnaProfile.vaccineTrigger}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        Matéria: <strong className="text-slate-200">{trapDnaProfile.targetSubject}</strong>
                      </span>
                      <Link
                        href={`/simulado?banca=${encodeURIComponent(trail.banca || "CEBRASPE")}&topic=${encodeURIComponent(trapDnaProfile.targetSubject)}&difficulty=HARD`}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold transition-all"
                      >
                        Treinar 5 Questões Deste Tema →
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: Aula antiga para não esquecer */}
                  {coolingMemoryLesson && (
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 flex flex-col justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                            🧊 Aula Que Você Pode Esquecer
                          </span>
                          <span className="text-[10px] font-mono font-bold text-cyan-300">
                            Estudada há {coolingMemoryLesson.daysSinceReview} dias
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-white line-clamp-1">
                          {coolingMemoryLesson.lesson.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Você já estudou este assunto de <strong>{coolingMemoryLesson.subjectName}</strong>. Clique abaixo para ler um resumo de 1 minuto e não esquecer até o dia da prova.
                        </p>
                      </div>
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            openTheoryModalForLesson(coolingMemoryLesson.lesson.id);
                            setIsSummaryMode(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-[11px] transition-all cursor-pointer"
                        >
                          ⚡ Ler Resumo de 1 Minuto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. GAVETA RECOLHÍVEL: DISCIPLINAS DO EDITAL & ATALHOS DO ECOSSISTEMA */}
            <div className="pt-1 border-t border-slate-800/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectsDrawer((prev) => !prev)}
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <span>
                    📚 {showSubjectsDrawer ? "Ocultar" : "Ver"} {editalSubjects.length} Disciplinas Sincronizadas do Edital
                  </span>
                  <span className="text-[10px]">{showSubjectsDrawer ? "▴" : "▾"}</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <Link
                    href="/edital"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-indigo-400" />
                    <span>Edital Verticalizado</span>
                  </Link>
                  <Link
                    href="/week"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <CalendarDays className="w-3 h-3 text-cyan-400" />
                    <span>Cronograma</span>
                  </Link>
                  <Link
                    href="/flashcards"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <Layers className="w-3 h-3 text-emerald-400" />
                    <span>{dueFlashcardsCount} Flashcards</span>
                  </Link>
                  <Link
                    href="/notebook"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <NotebookPen className="w-3 h-3 text-rose-400" />
                    <span>Caderno de Erros</span>
                  </Link>
                </div>
              </div>

              {showSubjectsDrawer && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {editalSubjects.map((sub: any) => {
                    const lvl =
                      sub.weight >= 8.5
                        ? { label: "Base", cls: "bg-amber-500/10 text-amber-300" }
                        : sub.weight <= 6.5
                          ? { label: "Avançado", cls: "bg-rose-500/10 text-rose-300" }
                          : { label: "Intermediário", cls: "bg-indigo-500/10 text-indigo-300" };
                    return (
                      <Link
                        key={sub.id}
                        href={`/edital?subjectId=${sub.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-2 text-xs transition-all"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sub.color || "#6366F1" }}
                        />
                        <span className="text-slate-200 font-semibold">{sub.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lvl.cls}`}>
                          {lvl.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            ABA 2: MEUS CURSOS EXTERNOS (ESTRATÉGIA, GRAN, PDFs)
           ========================================================= */}
        {activeTab === "cursos" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {externalCourses.map((course: any) => {
                const items = course.items || [];
                const doneCount = items.filter((i: any) => i.isCompleted).length;
                const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold uppercase">
                              {course.provider}
                            </span>
                            {course.subject && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                                🔗 {course.subject.name}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-white mt-1.5">{course.title}</h4>
                        </div>
                        <span className="text-sm font-mono font-black text-emerald-400">{pct}%</span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        {items.map((item: any) => (
                          <label
                            key={item.id}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={Boolean(item.isCompleted)}
                                onChange={() => handleToggleExternalCourseItem(course.id, item)}
                                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 cursor-pointer"
                              />
                              <span
                                className={
                                  item.isCompleted
                                    ? "text-slate-400 line-through"
                                    : "text-slate-200 font-semibold"
                                }
                              >
                                {item.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
                              {item.isCompleted ? "✓ +30 XP" : `${item.estimatedMinutes || 45} min`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL 1: LEITOR DE TEORIA PROFUNDA & INTERATIVA
         ========================================================= */}
      {isTheoryOpen && activeLesson && activeTheoryData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className={`rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh] border transition-colors ${
            readingTheme === "sepia"
              ? "bg-[#fbf0d9] border-[#e2d4b7] text-[#2c2214]"
              : readingTheme === "light"
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-slate-900 border-slate-700 text-slate-300"
          }`}>
            {/* Barra de Topo do Leitor */}
            <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 transition-colors ${
              readingTheme === "sepia"
                ? "bg-[#f5e7cc] border-[#decbb0]"
                : readingTheme === "light"
                  ? "bg-slate-100 border-slate-200"
                  : "bg-slate-950 border-slate-800"
            }`}>
              {/* Seletor de Aulas da Semana (Sempre começando pela Aula 1) */}
              <div className="flex items-center gap-2 flex-wrap">
                {theoryLessonsOfSelectedWeek.map((l: any, idx: number) => {
                  const isCurrent = l.id === activeLesson.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setActiveLessonId(l.id);
                        setLessonNotes(l.studentNotes || "");
                        setIsSummaryMode(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>
                        Aula {idx + 1}: {l.subject?.name || l.title.split("•")[1] || l.title}
                      </span>
                      {l.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>

              {/* Controles Principais de Estudo: Resumo Rápido + Ouvir Aula + Ajustes de Leitura + Fechar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsSummaryMode((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isSummaryMode
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSummaryMode ? "📖 Ver Teoria Completa" : "⚡ Resumo Rápido"}</span>
                </button>

                <button
                  onClick={toggleAudioLesson}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isSpeakingAudio
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                  }`}
                  title="Ouvir narração neural de estúdio desta aula"
                >
                  {isSpeakingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Parar Áudio</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ouvir Aula</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReaderSettings((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showReaderSettings
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-200"
                      : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                  }`}
                  title="Ajustar tamanho da letra, tema de leitura, nível da explicação, voz, timer ou imprimir"
                >
                  <span>⚙️ Ajustes</span>
                  {showReaderSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    stopAudioNarration();
                    setIsTheoryOpen(false);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                  title="Fechar aula"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Barra Colapsável de Ajustes de Leitura (Sob demanda, sem poluir o topo) */}
            {showReaderSettings && (
              <div className="px-4 py-2.5 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Nível da Explicação */}
                  <div className="inline-flex items-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 overflow-hidden">
                    <select
                      aria-label="Selecionar nível de dificuldade da aula"
                      value={activeLesson?.level || "BEGINNER"}
                      disabled={isSyncingAITheory}
                      onChange={(e) =>
                        handleSyncOrGenerateLessonTheory(
                          false,
                          e.target.value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                        )
                      }
                      className="bg-slate-950/90 px-2.5 py-1.5 text-[11px] font-bold text-indigo-200 focus:outline-none cursor-pointer"
                    >
                      <option value="BEGINNER">🌱 Explicação Fácil</option>
                      <option value="INTERMEDIATE">⚖️ Nível da Prova</option>
                      <option value="ADVANCED">🔥 Aprofundado</option>
                    </select>
                  </div>

                  {/* Tema de Leitura */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextTheme = readingTheme === "dark" ? "sepia" : readingTheme === "sepia" ? "light" : "dark";
                      handleSetReadingTheme(nextTheme);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-[11px] cursor-pointer"
                  >
                    {readingTheme === "dark" ? "🌙 Tema: Escuro" : readingTheme === "sepia" ? "📜 Tema: Sépia" : "☀️ Tema: Claro"}
                  </button>

                  {/* Tamanho da Letra */}
                  <button
                    type="button"
                    onClick={() =>
                      setLessonFontSize((prev) =>
                        prev === "normal" ? "large" : prev === "large" ? "xlarge" : "normal",
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-[11px] cursor-pointer"
                  >
                    🔤 Letra: {lessonFontSize === "normal" ? "Normal (A+)" : lessonFontSize === "large" ? "Grande (A++)" : "Extra Grande"}
                  </button>

                  {/* Voz do Áudio */}
                  <select
                    aria-label="Selecionar voz neural da aula"
                    value={selectedVoiceURI}
                    onChange={(e) => handleChangeVoice(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {NEURAL_VOICE_OPTIONS.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        🎙️ Voz: {v.name.split(" ")[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={printLessonApostila}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Imprimir Aula</span>
                  </button>

                  <button
                    onClick={() => setPomodoroRunning((r) => !r)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    {pomodoroRunning ? (
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{formatTimer(pomodoroSeconds)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Corpo da Aula (Scrollável com Tamanho de Letra e Tema Ajustáveis) */}
            <div
              className={`p-6 sm:p-8 overflow-y-auto space-y-6 leading-relaxed transition-colors ${
                readingTheme === "sepia"
                  ? "text-[#3b2b18]"
                  : readingTheme === "light"
                    ? "text-slate-800"
                    : "text-slate-300"
              } ${
                lessonFontSize === "xlarge"
                  ? "text-lg"
                  : lessonFontSize === "large"
                    ? "text-base"
                    : "text-sm"
              }`}
            >
              {/* Cabeçalho da Aula */}
              <div className={`space-y-2 border-b pb-5 ${readingTheme === "sepia" ? "border-[#decbb0]" : readingTheme === "light" ? "border-slate-200" : "border-slate-800"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono font-bold uppercase">
                    {activeTheoryData.moduleTag}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase">
                    {activeTheoryData.bancaTag}
                  </span>
                  {activeLesson.topic && (
                    <Link
                      href={`/mapas-mentais`}
                      className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold hover:bg-purple-500/20 transition-colors"
                    >
                      🧠 Ver Mapa Mental
                    </Link>
                  )}

                  {/* Feedback Simples para o Aluno */}
                  <div className="ml-auto inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        showToast("👍 Que ótimo! Vamos manter esse estilo de explicação para você.")
                      }
                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      👍 Gostei da Explicação
                    </button>
                    <button
                      type="button"
                      disabled={isSyncingAITheory}
                      onClick={() =>
                        handleSyncOrGenerateLessonTheory(
                          true,
                          (activeLesson?.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") ||
                            "INTERMEDIATE",
                        )
                      }
                      className="px-2.5 py-0.5 rounded-md bg-slate-900 hover:bg-amber-950/50 border border-slate-700 hover:border-amber-500/40 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="Não entendeu bem? Clique para gerar uma nova explicação com outros exemplos"
                    >
                      {isSyncingAITheory ? "🔄 Criando nova explicação..." : "🔄 Explicar de Outro Jeito"}
                    </button>
                  </div>
                </div>
                <h2 className={`text-xl sm:text-2xl font-extrabold ${
                  readingTheme === "sepia"
                    ? "text-[#241708]"
                    : readingTheme === "light"
                      ? "text-slate-950"
                      : "text-white"
                }`}>
                  {activeLesson.title}
                </h2>
              </div>

              {/* 🧬 BARRA DE TEORIA VIVA + CONCEITOS GÊMEOS (1 LINHA LIMPA + EXPANSÍVEL) */}
              {(() => {
                const livingData = getLivingTheoryForLesson(activeLesson);
                if (!livingData) return null;
                return (
                  <div className="rounded-xl bg-slate-950/90 border border-rose-500/35 overflow-hidden">
                    <div className="p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-extrabold uppercase">
                          {livingData.isFromRealError ? "🚨 Seu Alerta de Erro" : "⚖️ Conceitos Gêmeos"}
                        </span>
                        <span className="font-bold text-white">
                          {livingData.alertTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLivingTheoryTable((prev) => !prev)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-[11px] transition-all cursor-pointer"
                      >
                        {showLivingTheoryTable
                          ? "Ocultar Quadro Anti-Confusão ▴"
                          : "⚖️ Ver Quadro Anti-Confusão ▾"}
                      </button>
                    </div>

                    {showLivingTheoryTable && (
                      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {livingData.errorSnippet}
                        </p>

                        <div className="rounded-xl border border-slate-800 overflow-hidden">
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 text-xs">
                            <div className="p-3.5 space-y-1 bg-rose-950/15">
                              <div className="font-extrabold text-rose-300 text-[11px]">
                                {livingData.twinConceptLeftTitle}
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                {livingData.twinConceptLeftBody}
                              </p>
                            </div>
                            <div className="p-3.5 space-y-1 bg-emerald-950/15">
                              <div className="font-extrabold text-emerald-300 text-[11px]">
                                {livingData.twinConceptRightTitle}
                              </div>
                              <p className="text-slate-200 text-[11px] leading-relaxed font-medium">
                                {livingData.twinConceptRightBody}
                              </p>
                            </div>
                          </div>
                          <div className="px-3.5 py-2 bg-indigo-950/40 border-t border-indigo-500/30 text-[11px] font-bold text-indigo-200 flex items-center justify-between flex-wrap gap-2">
                            <span>⚡ {livingData.differentiatorKeyword}</span>
                            <button
                              type="button"
                              onClick={printPersonalEveSheetA4}
                              className="text-[10px] font-mono font-extrabold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                            >
                              + Imprimir na Folha de Véspera A4
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MODO RESUMO RÁPIDO vs TEORIA COMPLETA */}
              {isSummaryMode ? (
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <h4 className="text-xs font-mono uppercase font-extrabold text-amber-300 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Resumo Direto de Véspera (Pontos-Chave da Prova)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-200 list-disc pl-5">
                    {activeTheoryData.summaryPoints.map((pt, i) => (
                      <li key={i} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Introdução */}
                  <p className={`font-medium leading-relaxed p-4 rounded-2xl border ${
                    readingTheme === "sepia"
                      ? "bg-[#f4e4c3] text-[#2c2214] border-[#dccea9]"
                      : readingTheme === "light"
                        ? "bg-slate-50 text-slate-800 border-slate-200"
                        : "bg-slate-950/50 text-slate-200 border-slate-800/80"
                  }`}>
                    {activeTheoryData.introLead}
                  </p>

                  {/* Seções Teóricas */}
                  {activeTheoryData.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="text-base font-bold text-white">{sec.heading}</h3>
                      <p className="text-slate-300 leading-relaxed">{sec.body}</p>
                      {sec.calloutTitle && sec.calloutText && (
                        <div
                          className={`p-4 rounded-2xl border space-y-1 ${
                            sec.calloutType === "warning"
                              ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                              : sec.calloutType === "emerald"
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                                : "bg-indigo-950/25 border-indigo-500/30 text-indigo-200"
                          }`}
                        >
                          <div className="text-xs font-extrabold">{sec.calloutTitle}</div>
                          <p className="text-xs opacity-90">{sec.calloutText}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tabela Comparativa */}
                  {activeTheoryData.tableData && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                            {activeTheoryData.tableData.headers.map((h, i) => (
                              <th key={i} className="p-3.5 font-bold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 bg-slate-900/40">
                          {activeTheoryData.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/30">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`p-3.5 ${
                                    cIdx === 0 ? "font-bold text-white" : "text-slate-300"
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Dica Estratégica / Mnemônico */}
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                      💡 {activeTheoryData.examTipTitle}
                    </span>
                    <p className="text-xs text-slate-200 font-medium">
                      {activeTheoryData.examTipText}
                    </p>
                  </div>
                </div>
              )}

              {/* QUESTÃO DE FIXAÇÃO INTERATIVA (SINCRONIZADA COM EDITAL E CADERNO DE ERROS) */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold uppercase text-indigo-400">
                    ✍️ Teste Rápido de Fixação ({activeTheoryData.fixationQuiz.bancaTag})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    +15 XP ao acertar
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-white">
                  {activeTheoryData.fixationQuiz.question}
                </p>

                <div className="space-y-2 text-xs">
                  {activeTheoryData.fixationQuiz.options.map((opt) => {
                    const answered = quizAnswers[activeLesson.id];
                    const isSelected = answered?.selectedId === opt.id;
                    const isRightOption =
                      opt.id === activeTheoryData.fixationQuiz.correctOptionId;

                    let btnCls =
                      "w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer";
                    if (answered) {
                      if (isSelected && answered.isCorrect) {
                        btnCls =
                          "w-full text-left p-3 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-200 font-semibold cursor-pointer";
                      } else if (isSelected && !answered.isCorrect) {
                        btnCls =
                          "w-full text-left p-3 rounded-xl bg-rose-950/40 border border-rose-500 text-rose-200 font-semibold cursor-pointer";
                      } else if (isRightOption) {
                        btnCls =
                          "w-full text-left p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 cursor-pointer";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswerFixationQuiz(opt.id)}
                        className={btnCls}
                      >
                        <strong className="mr-1.5">{opt.id})</strong> {opt.text}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback imediato + Botão de 1 Clique para salvar no Caderno de Erros se errou */}
                {quizAnswers[activeLesson.id] && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-3 ${
                      quizAnswers[activeLesson.id].isCorrect
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    }`}
                  >
                    <p className="leading-relaxed">
                      {quizAnswers[activeLesson.id].isCorrect ? "✅ " : "❌ "}
                      {activeTheoryData.fixationQuiz.explanation}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                      <span className="font-mono text-[11px] opacity-90">
                        🧠 Mnemônico: {activeTheoryData.fixationQuiz.mnemonic}
                      </span>

                      {!quizAnswers[activeLesson.id].isCorrect ? (
                        <button
                          onClick={handleSaveQuizToErrorNotebook}
                          disabled={quizAnswers[activeLesson.id].savedToNotebook}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all ${
                            quizAnswers[activeLesson.id].savedToNotebook
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                          }`}
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>
                            {quizAnswers[activeLesson.id].savedToNotebook
                              ? "✓ Salvo no Caderno de Erros"
                              : "+ Guardar no Caderno de Erros"}
                          </span>
                        </button>
                      ) : (
                        activeLesson?.level !== "ADVANCED" && (
                          <button
                            onClick={() =>
                              handleSyncOrGenerateLessonTheory(false, "ADVANCED")
                            }
                            disabled={isSyncingAITheory}
                            className="px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                            title="Carregar versão Hardcore desta aula (ou reutilizar de outro aluno avançado)"
                          >
                            <Flame className="w-3.5 h-3.5 text-rose-400" />
                            <span>🔥 Achou fácil? Subir para Nível Hardcore</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* BLOCO DE ANOTAÇÕES PESSOAIS DO ALUNO (PERSISTIDO NO BANCO) */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    📝 Minhas Anotações desta Aula
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">{notesSaveStatus}</span>
                </div>
                <textarea
                  rows={2}
                  value={lessonNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Escreva aqui seus próprios gatilhos de memória ou observações sobre esta aula..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* DÚVIDAS FREQUENTES PRÉ-GERADAS DESTA AULA */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Dúvidas Frequentes desta Aula</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Clique sobre uma pergunta abaixo para expandir a explicação detalhada:
                  </p>
                </div>

                <div className="space-y-2">
                  {activeTheoryData.faqItems.map((faq, fIdx) => {
                    const isOpen = Boolean(openFaqIndices[fIdx]);
                    return (
                      <div
                        key={fIdx}
                        className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setOpenFaqIndices((prev) => ({ ...prev, [fIdx]: !prev[fIdx] }))
                          }
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors cursor-pointer"
                        >
                          <span className="text-xs font-bold text-indigo-300">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-300 border-t border-slate-900">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal (Sincronização com Cartões de Memória e Conclusão da Aula) */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleCreateFlashcardsFromLesson}
                disabled={Boolean(flashcardsCreatedMap[activeLesson.id]) || isGeneratingCards}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                  flashcardsCreatedMap[activeLesson.id]
                    ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {flashcardsCreatedMap[activeLesson.id]
                    ? `✓ ${flashcardsCreatedMap[activeLesson.id]} Cartões Salvos para Revisão!`
                    : "🎴 Criar Cartões de Memória desta Aula"}
                </span>
              </button>

              <button
                onClick={handleCompleteAndAdvanceInModal}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
              >
                ✓ Concluir Aula (+40 XP) e Avançar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: ESTÚDIO DE CRIAÇÃO / CUSTOMIZAÇÃO DE TRILHA (3 PASSOS)
         ========================================================= */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh]">
            {/* Cabeçalho do Wizard */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                  Estúdio de Customização • Passo {wizardStep} de 3
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Configurar Minha Trilha & Sincronizar Edital
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300 block">
                        Concurso / Cargo Alvo (Livre):
                      </label>
                      <input
                        type="text"
                        value={wizardTitle}
                        onChange={(e) => setWizardTitle(e.target.value)}
                        placeholder="Ex: Prefeitura de Santos - Analista de TI"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300 block">
                        Banca Examinadora (Selecione ou Digite qualquer banca):
                      </label>
                      <input
                        type="text"
                        value={wizardBanca}
                        onChange={(e) => setWizardBanca(e.target.value)}
                        placeholder="Ex: IBAM, Quadrix, Vunesp, Cebraspe, FGV..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {["IBAM", "Cebraspe", "FGV", "Vunesp", "FCC", "Quadrix", "AOCP"].map(
                          (b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setWizardBanca(b)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                                wizardBanca.toUpperCase() === b.toUpperCase()
                                  ? "bg-indigo-600 text-white font-bold"
                                  : "bg-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              {b}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="font-bold text-indigo-300 block">
                      📋 Opcional: Cole aqui o Conteúdo Programático do seu Edital para extrair matérias:
                    </label>
                    <textarea
                      rows={4}
                      value={wizardRawEdital}
                      onChange={(e) => setWizardRawEdital(e.target.value)}
                      placeholder="Ex: Língua Portuguesa: Sintaxe, Crase.&#10;Lei Orgânica Municipal: Competências e Processo Legislativo.&#10;Banco de Dados: SQL, 1FN a 3FN."
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
                    />
                    {wizardRawEdital.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleExtractFromRawEdital}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-bold hover:bg-indigo-600/30 cursor-pointer"
                      >
                        ✨ Extrair Disciplinas deste Texto e Avançar →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 flex items-center justify-between">
                    <span>
                      🔗 <strong>Sincronização Automática com seu Edital:</strong> As disciplinas abaixo já estão conectadas ao seu Edital Verticalizado (`/edital`). Ajuste seu nível em cada uma!
                    </span>
                  </div>

                  {/* Adicionar nova matéria avulsa */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Adicionar disciplina (ex: Engenharia de Software, Regimento Interno...)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                    <select
                      value={newSubjectLevel}
                      onChange={(e) => setNewSubjectLevel(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                    >
                      <option value="BEGINNER">Iniciante (Teoria do Zero)</option>
                      <option value="INTERMEDIATE">Intermediário (Esquematizado)</option>
                      <option value="ADVANCED">Avançado (Resumo + Questões)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSubjectName.trim()) return;
                        setWizardSubjects((prev) => [
                          ...prev,
                          { name: newSubjectName.trim(), level: newSubjectLevel },
                        ]);
                        setNewSubjectName("");
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {/* Lista de matérias */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {wizardSubjects.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="font-bold text-white">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          {(
                            [
                              { id: "BEGINNER", label: "Iniciante" },
                              { id: "INTERMEDIATE", label: "Intermediário" },
                              { id: "ADVANCED", label: "Avançado" },
                            ] as const
                          ).map((lvl) => (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() =>
                                setWizardSubjects((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, level: lvl.id } : item,
                                  ),
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
                                sub.level === lvl.id
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-900 text-slate-400 hover:text-white"
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setWizardSubjects((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-bold text-slate-300 block">
                      Dias da Semana Disponíveis (Sincronizado com seu Cronograma Semanal):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => {
                        const active = wizardDays.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              setWizardDays((prev) =>
                                prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                              )
                            }
                            className={`px-3.5 py-2 rounded-xl font-mono font-bold cursor-pointer ${
                              active
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-950 border border-slate-800 text-slate-400"
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300 block">
                        Horas por dia (Seg a Sex): {wizardDailyHours}h/dia
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        value={wizardDailyHours}
                        onChange={(e) => setWizardDailyHours(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300 block">
                        Horas no Fim de Semana: {wizardWeekendHours}h/dia
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={wizardWeekendHours}
                        onChange={(e) => setWizardWeekendHours(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block">
                      Instruções Específicas para sua Trilha (Opcional):
                    </label>
                    <textarea
                      rows={3}
                      value={wizardInstructions}
                      onChange={(e) => setWizardInstructions(e.target.value)}
                      placeholder="Ex: Quero bastante foco em jurisprudência e tabelas comparativas para TI..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  ← Voltar
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => (s + 1) as 1 | 2 | 3)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer"
                >
                  Próximo Passo →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateCustomTrail}
                  disabled={isSubmittingWizard}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {isSubmittingWizard
                    ? "Gerando e Sincronizando Edital..."
                    : "🚀 Gerar Minha Trilha e Sincronizar Sistema"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: CADASTRAR CURSO EXTERNO / PACOTE DE PDFs
         ========================================================= */}
      {isNewCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewExternalCourse}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                📚 Cadastrar Curso Externo / PDFs
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCourseModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Nome do Curso / Disciplina:</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Ex: Direito Constitucional Extensivo (PDFs)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Cursinho / Origem:</label>
                  <input
                    type="text"
                    value={newCourseProvider}
                    onChange={(e) => setNewCourseProvider(e.target.value)}
                    placeholder="Ex: Estratégia, Gran, Direção..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Vincular à Matéria do Edital:</label>
                  <select
                    value={newCourseSubjectId}
                    onChange={(e) => setNewCourseSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="">Opcional (Geral)</option>
                    {editalSubjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Aulas / PDFs (1 por linha):
                </label>
                <textarea
                  rows={4}
                  value={newCourseItemsText}
                  onChange={(e) => setNewCourseItemsText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewCourseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingCourse}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer"
              >
                {isCreatingCourse ? "Salvando..." : "Salvar Curso"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL 4: PAYWALL & DEGUSTAÇÃO DO PLANO SYNAPSE ELITE 👑
         ========================================================= */}
      {elitePaywall.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-amber-950/40">
            <div className="p-6 bg-linear-to-b from-amber-500/15 via-slate-900 to-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Recurso Exclusivo Synapse Elite
                </span>
                <button
                  type="button"
                  onClick={() => setElitePaywall((p) => ({ ...p, open: false }))}
                  className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-black text-white">{elitePaywall.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {elitePaywall.description}
              </p>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-extrabold text-amber-300 uppercase text-[10px] tracking-wider">
                  O que o Synapse Elite 👑 libera para você:
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Gerador Universal de Trilhas & Teorias 2.0 p/ qualquer banca (IBAM, TI, FGV, Cebraspe)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Apostilas de Bolso A4 Imprimíveis + Áudio-Aulas com Vozes Neurais de Estúdio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Múltiplas Trilhas Simultâneas + 120 Ajudas com IA/dia</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                {elitePaywall.onContinuePreview && (
                  <button
                    type="button"
                    onClick={elitePaywall.onContinuePreview}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    🔓 Testar Agora (Degustação Grátis)
                  </button>
                )}
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto flex-1 py-3 px-4 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black text-center shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>Conhecer Synapse Elite 👑</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mini Player Flutuante da Playlist Hands-Free */}
      {isPlaylistMode && theoryLessonsOfSelectedWeek.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-slate-950/95 border-2 border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-950/80 p-3 sm:p-4 backdrop-blur-2xl flex items-center justify-between gap-3 text-white animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300">
              <Headphones className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider block">
                Playlist Hands-Free • Aula {playlistIndex + 1} de {theoryLessonsOfSelectedWeek.length}
              </span>
              <p className="text-xs font-bold truncate text-slate-100">
                {theoryLessonsOfSelectedWeek[playlistIndex]?.title || "Aula em áudio"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePlaylistPrev}
              disabled={playlistIndex === 0}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
              title="Aula Anterior"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={toggleAudioLesson}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md"
            >
              {isSpeakingAudio ? "⏸ Pausar" : "▶ Tocar"}
            </button>
            <button
              type="button"
              onClick={handlePlaylistNext}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Próxima Aula"
            >
              ⏭
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaylistMode(false);
                stopAudioNarration();
              }}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Fechar Playlist"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
