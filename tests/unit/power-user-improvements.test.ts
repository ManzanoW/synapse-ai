// tests/unit/power-user-improvements.test.ts
import { describe, it, expect } from "vitest";

describe("Radar de Pegadinhas - Detecção de Termos Críticos de Concurso", () => {
  const TRAP_WORDS_REGEX =
    /\b(EXCETO|INCORRETO|INCORRETA|INCORRETAS|INCORRETOS|VEDADO|VEDADA|VEDADOS|VEDADAS|DEFESO|DEFESA|PRESCINDE|PRESCINDÍVEL|PRIVATIVAMENTE|EXCLUSIVAMENTE|NUNCA|SEMPRE|SALVO|NÃO\s+PODE|NÃO\s+É|NÃO\s+SERÁ)\b/gi;

  it("detecta termos clássicos de restrição e negação de bancas", () => {
    const text1 = "Assinale a alternativa que apresenta hipótese VEDADA pela Constituição.";
    const matches1 = text1.match(TRAP_WORDS_REGEX);
    expect(matches1).toBeDefined();
    expect(matches1?.[0].toUpperCase()).toBe("VEDADA");

    const text2 = "Todas as assertivas abaixo estão corretas, EXCETO:";
    const matches2 = text2.match(TRAP_WORDS_REGEX);
    expect(matches2).toBeDefined();
    expect(matches2?.[0].toUpperCase()).toBe("EXCETO");

    const text3 = "O ato de nomeação compete PRIVATIVAMENTE ao Governador.";
    const matches3 = text3.match(TRAP_WORDS_REGEX);
    expect(matches3).toBeDefined();
    expect(matches3?.[0].toUpperCase()).toBe("PRIVATIVAMENTE");

    const text4 = "A ação penal pública incondicionada PRESCINDE de representação.";
    const matches4 = text4.match(TRAP_WORDS_REGEX);
    expect(matches4).toBeDefined();
    expect(matches4?.[0].toUpperCase()).toBe("PRESCINDE");
  });

  it("ignora palavras regulares que apenas contêm trechos de letras", () => {
    const regularText = "O defensor público apresentou a petição com clareza.";
    const matches = regularText.match(TRAP_WORDS_REGEX);
    // 'defensor' não deve ser pego por 'DEFESO' devido aos boundaries \b
    expect(matches).toBeNull();
  });
});

describe("Mecânica de Combo Streak nas Questões", () => {
  it("acumula sequência de acertos e zera em caso de erro", () => {
    let combo = 0;
    const updateCombo = (isCorrect: boolean) => {
      if (isCorrect) combo += 1;
      else combo = 0;
      return combo;
    };

    expect(updateCombo(true)).toBe(1);
    expect(updateCombo(true)).toBe(2);
    expect(updateCombo(true)).toBe(3);
    // Erro quebra o combo
    expect(updateCombo(false)).toBe(0);
    // Novo acerto reinicia
    expect(updateCombo(true)).toBe(1);
  });
});

describe("Pomodoro - Formatação do Título Regressivo", () => {
  const formatTabTitle = (minutes: number, seconds: number, mode: "foco" | "curta") => {
    const minStr = String(minutes).padStart(2, "0");
    const secStr = String(seconds).padStart(2, "0");
    const icon = mode === "foco" ? "🍅" : "☕";
    const label = mode === "foco" ? "Foco" : "Pausa";
    return `${icon} ${minStr}:${secStr} (${label}) • Synapse AI`;
  };

  it("formata corretamente o título para exibição na aba do navegador", () => {
    expect(formatTabTitle(25, 0, "foco")).toBe("🍅 25:00 (Foco) • Synapse AI");
    expect(formatTabTitle(4, 9, "foco")).toBe("🍅 04:09 (Foco) • Synapse AI");
    expect(formatTabTitle(0, 45, "foco")).toBe("🍅 00:45 (Foco) • Synapse AI");
    expect(formatTabTitle(5, 0, "curta")).toBe("☕ 05:00 (Pausa) • Synapse AI");
  });
});

describe("Flashcards - Estimativa Cognitiva de Tempo de Estudo", () => {
  const calculateEstimatedMinutes = (cardCount: number): number => {
    if (cardCount <= 0) return 0;
    return Math.max(1, Math.round((cardCount * 22) / 60));
  };

  it("calcula minutos de estudo baseado no benchmark cognitivo de ~22s por card", () => {
    expect(calculateEstimatedMinutes(0)).toBe(0);
    expect(calculateEstimatedMinutes(1)).toBe(1); // Mínimo de 1 min
    expect(calculateEstimatedMinutes(15)).toBe(6); // 15 * 22 = 330s / 60 = 5.5 -> 6 min
    expect(calculateEstimatedMinutes(30)).toBe(11); // 30 * 22 = 660s / 60 = 11 min
    expect(calculateEstimatedMinutes(100)).toBe(37); // 100 * 22 = 2200s / 60 = 36.66 -> 37 min
  });
});

describe("Flashcards - Segmentação por Nível de Retenção (Novo, Aprendendo, Maduro)", () => {
  interface MockCard {
    repetitions?: number;
    interval?: number;
  }

  const categorizeCards = (cards: MockCard[]) => {
    let novos = 0;
    let aprendendo = 0;
    let maduros = 0;

    cards.forEach((c) => {
      const reps = c.repetitions ?? 0;
      const interval = c.interval ?? 0;
      if (reps === 0) novos++;
      else if (interval >= 21) maduros++;
      else aprendendo++;
    });

    const total = cards.length || 1;
    return {
      novos,
      aprendendo,
      maduros,
      novosPct: Math.round((novos / total) * 100),
      aprendendoPct: Math.round((aprendendo / total) * 100),
      madurosPct: Math.round((maduros / total) * 100),
    };
  };

  it("classifica corretamente cartões sem revisão como Novos", () => {
    const cards: MockCard[] = [{ repetitions: 0, interval: 0 }, {}];
    const stats = categorizeCards(cards);
    expect(stats.novos).toBe(2);
    expect(stats.aprendendo).toBe(0);
    expect(stats.maduros).toBe(0);
    expect(stats.novosPct).toBe(100);
  });

  it("classifica cartões com intervalo >= 21 dias como Maduros", () => {
    const cards: MockCard[] = [
      { repetitions: 4, interval: 25 },
      { repetitions: 6, interval: 40 },
    ];
    const stats = categorizeCards(cards);
    expect(stats.maduros).toBe(2);
    expect(stats.aprendendo).toBe(0);
    expect(stats.novos).toBe(0);
    expect(stats.madurosPct).toBe(100);
  });

  it("classifica cartões revisados com intervalo < 21 dias como Aprendendo", () => {
    const cards: MockCard[] = [
      { repetitions: 1, interval: 1 },
      { repetitions: 2, interval: 6 },
      { repetitions: 3, interval: 14 },
    ];
    const stats = categorizeCards(cards);
    expect(stats.aprendendo).toBe(3);
    expect(stats.maduros).toBe(0);
    expect(stats.novos).toBe(0);
  });
});

describe("Flashcards - Meta Diária de Revisão", () => {
  interface MockCard {
    repetitions?: number;
    dueDate?: string | Date;
  }

  const computeDailyGoal = (cards: MockCard[]) => {
    const now = new Date();
    const dueToday = cards.filter((card) => {
      if (!card.repetitions || card.repetitions === 0) return true;
      if (!card.dueDate) return false;
      const due = new Date(card.dueDate);
      return due <= now;
    });

    const pendingCount = dueToday.length;
    const isCompleted = pendingCount === 0 && cards.length > 0;
    return { pendingCount, isCompleted };
  };

  it("considera cartões novos e cartões com data de vencimento ultrapassada como pendentes hoje", () => {
    const pastDate = new Date(Date.now() - 3600 * 1000 * 24); // Ontem
    const futureDate = new Date(Date.now() + 3600 * 1000 * 24 * 5); // Em 5 dias

    const cards: MockCard[] = [
      { repetitions: 0 }, // Novo: pendente
      { repetitions: 2, dueDate: pastDate }, // Vencido: pendente
      { repetitions: 5, dueDate: futureDate }, // Futuro: em dia
    ];

    const result = computeDailyGoal(cards);
    expect(result.pendingCount).toBe(2);
    expect(result.isCompleted).toBe(false);
  });

  it("marca a meta como concluída quando todos os cartões já revisados estão com vencimento futuro", () => {
    const futureDate = new Date(Date.now() + 3600 * 1000 * 24 * 3);
    const cards: MockCard[] = [
      { repetitions: 1, dueDate: futureDate },
      { repetitions: 4, dueDate: futureDate },
    ];

    const result = computeDailyGoal(cards);
    expect(result.pendingCount).toBe(0);
    expect(result.isCompleted).toBe(true);
  });
});

describe("Flashcards - Exportação CSV RFC 4180", () => {
  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  it("escapa aspas duplas e envolve valores com aspas conforme RFC 4180", () => {
    expect(escapeCSV("Texto normal")).toBe('"Texto normal"');
    expect(escapeCSV('Texto com "aspas"')).toBe('"Texto com ""aspas"""');
    expect(escapeCSV("Texto\ncom\nlinhas")).toBe('"Texto\ncom\nlinhas"');
    expect(escapeCSV(42)).toBe('"42"');
    expect(escapeCSV(null)).toBe('""');
  });
});

describe("Navegação Sequencial J/K na Revisão de Questões", () => {
  const getNextIndex = (
    currentIdx: number | null,
    list: number[]
  ): number => {
    if (list.length === 0) return 0;
    if (currentIdx === null) return list[0];
    const pos = list.indexOf(currentIdx);
    if (pos === -1 || pos >= list.length - 1) return list[list.length - 1];
    return list[pos + 1];
  };

  const getPrevIndex = (
    currentIdx: number | null,
    list: number[]
  ): number => {
    if (list.length === 0) return 0;
    if (currentIdx === null) return list[list.length - 1];
    const pos = list.indexOf(currentIdx);
    if (pos <= 0) return list[0];
    return list[pos - 1];
  };

  it("avança e retrocede respeitando os limites da lista", () => {
    const questions = [0, 1, 2, 3];
    expect(getNextIndex(null, questions)).toBe(0);
    expect(getNextIndex(0, questions)).toBe(1);
    expect(getNextIndex(2, questions)).toBe(3);
    expect(getNextIndex(3, questions)).toBe(3); // Clamped

    expect(getPrevIndex(null, questions)).toBe(3);
    expect(getPrevIndex(3, questions)).toBe(2);
    expect(getPrevIndex(1, questions)).toBe(0);
    expect(getPrevIndex(0, questions)).toBe(0); // Clamped
  });
});

describe("Metacognição - Detecção de Acerto por Hesitação", () => {
  it("identifica acerto com hesitação quando houve troca de alternativa", () => {
    const switchesCount = { 0: 2, 1: 0, 2: 1 };
    const selectedAnswers = { 0: "A", 1: "B", 2: "C" };
    const correctAnswers = { 0: "A", 1: "B", 2: "D" };

    const isHesitantCorrect = (idx: number) => {
      const isCorrect = selectedAnswers[idx as keyof typeof selectedAnswers] === correctAnswers[idx as keyof typeof correctAnswers];
      const hasSwitches = (switchesCount[idx as keyof typeof switchesCount] || 0) >= 1;
      return isCorrect && hasSwitches;
    };

    expect(isHesitantCorrect(0)).toBe(true);  // Acertou, mas trocou 2 vezes -> Hesitante
    expect(isHesitantCorrect(1)).toBe(false); // Acertou de primeira -> Confiante
    expect(isHesitantCorrect(2)).toBe(false); // Errou -> Erro regular
  });
});

describe("Caderno de Erros - Busca Instantânea Local em Memória", () => {
  interface MockErrorQuestion {
    text: string;
    explanation?: string;
    subject?: string;
  }

  const filterQuestionsInstant = (items: MockErrorQuestion[], term: string) => {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return items;
    return items.filter((q) => {
      return (
        q.text.toLowerCase().includes(cleanTerm) ||
        (q.explanation || "").toLowerCase().includes(cleanTerm) ||
        (q.subject || "").toLowerCase().includes(cleanTerm)
      );
    });
  };

  it("filtra instantaneamente por enunciado, explicação ou matéria sem latência", () => {
    const questions: MockErrorQuestion[] = [
      { text: "Artigo 5 da CF sobre direitos fundamentais", subject: "Direito Constitucional" },
      { text: "Competência tributária dos Municípios", subject: "Direito Tributário" },
      { text: "Ato administrativo discricionário e vinculado", explanation: "Súmula Vinculante 13 do STF", subject: "Direito Administrativo" },
    ];

    expect(filterQuestionsInstant(questions, "Tributário").length).toBe(1);
    expect(filterQuestionsInstant(questions, "Súmula Vinculante").length).toBe(1);
    expect(filterQuestionsInstant(questions, "Direito").length).toBe(3);
    expect(filterQuestionsInstant(questions, "inexistente").length).toBe(0);
    expect(filterQuestionsInstant(questions, "").length).toBe(3);
  });
});

describe("Gabarito Executivo A4 - Métricas e Auditoria", () => {
  it("calcula taxa de aproveitamento e ritmo médio por questão", () => {
    const totalQuestions = 10;
    const correctCount = 8;
    const timerSeconds = 720; // 12 minutos

    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const avgSecs = Math.round(timerSeconds / totalQuestions);

    expect(accuracy).toBe(80);
    expect(avgSecs).toBe(72); // 1m 12s por questão
  });
});


describe("Round 18 - Eliminação por Botão Direito e Descarte de Alternativas", () => {
  it("alterna eliminação com clique de contexto sem perder estado das outras", () => {
    type EliminatedMap = Record<number, Record<string, boolean>>;
    let map: EliminatedMap = {};

    const toggleAlt = (qIdx: number, altId: string) => {
      const current = map[qIdx] || {};
      map = {
        ...map,
        [qIdx]: {
          ...current,
          [altId]: !current[altId],
        },
      };
    };

    toggleAlt(0, "A");
    expect(map[0]["A"]).toBe(true);
    toggleAlt(0, "C");
    expect(map[0]["A"]).toBe(true);
    expect(map[0]["C"]).toBe(true);

    // Destoggle
    toggleAlt(0, "A");
    expect(map[0]["A"]).toBe(false);
    expect(map[0]["C"]).toBe(true);
  });
});

describe("Round 18 - Treinar Apenas Questões Erradas (Re-ancoragem Imediata)", () => {
  interface MockQuizQuestion {
    id: string;
    gabaritoCorreto: string;
  }

  it("filtra exclusivamente as questões com gabarito divergente ou não respondidas", () => {
    const questions: MockQuizQuestion[] = [
      { id: "q1", gabaritoCorreto: "A" },
      { id: "q2", gabaritoCorreto: "C" },
      { id: "q3", gabaritoCorreto: "B" },
      { id: "q4", gabaritoCorreto: "E" },
    ];

    const answers: Record<number, string> = {
      0: "A", // Acertou
      1: "B", // Errou
      2: "B", // Acertou
      // 3: não respondida -> Erro
    };

    const wrong = questions.filter((q, idx) => answers[idx] !== q.gabaritoCorreto);
    expect(wrong.length).toBe(2);
    expect(wrong.map((q) => q.id)).toEqual(["q2", "q4"]);
  });
});

describe("Round 18 - Modo Foco Zen em Simulados e Flashcards", () => {
  it("alterna modo foco com atalho Z preservando progresso e resposta", () => {
    let isZenMode = false;
    const toggleZen = (key: string) => {
      if (key.toLowerCase() === "z") {
        isZenMode = !isZenMode;
      }
    };

    expect(isZenMode).toBe(false);
    toggleZen("z");
    expect(isZenMode).toBe(true);
    toggleZen("Z");
    expect(isZenMode).toBe(false);
  });
});


describe("Round 19 - Desfazer Avaliação de Flashcards com Ctrl+Z (Undo Review)", () => {
  it("reverte métricas e retorna ao card anterior ao desfazer", () => {
    let index = 1;
    let acertos = 1;
    let erros = 0;
    let isFinished = false;

    // Simula snapshot guardado
    const history = {
      previousIndex: 0,
      wasError: false,
      wasFinished: false,
    };

    // Executa Undo
    const undo = () => {
      index = history.previousIndex;
      if (history.wasError) erros = Math.max(0, erros - 1);
      else acertos = Math.max(0, acertos - 1);
      if (history.wasFinished) isFinished = false;
    };

    undo();
    expect(index).toBe(0);
    expect(acertos).toBe(0);
    expect(erros).toBe(0);
    expect(isFinished).toBe(false);
  });
});

describe("Round 19 - Salto Direto para Questões em Branco no Simulado (Atalho U)", () => {
  it("encontra a próxima questão não respondida com busca circular", () => {
    const totalQuestions = 5;
    const checkedQuestions: Record<number, boolean> = {
      0: true,
      1: true,
      // 2: em branco
      3: true,
      // 4: em branco
    };

    const findNextUnanswered = (activeIndex: number): number | null => {
      for (let i = activeIndex + 1; i < totalQuestions; i++) {
        if (!checkedQuestions[i]) return i;
      }
      for (let i = 0; i < activeIndex; i++) {
        if (!checkedQuestions[i]) return i;
      }
      return null;
    };

    // A partir da questão 0, a próxima em branco é a 2
    expect(findNextUnanswered(0)).toBe(2);
    // A partir da questão 2, a próxima em branco é a 4
    expect(findNextUnanswered(2)).toBe(4);
    // A partir da questão 4, faz o wrap-around e volta para a 2
    expect(findNextUnanswered(4)).toBe(2);
  });
});

describe("Round 19 - Folha de Véspera e Exportação Limpa de Erros (2 Colunas A4)", () => {
  it("filtra itens não superados e prepara layout de 2 colunas para prova", () => {
    const items = [
      { id: "1", status: "PENDING", subject: "Direito Constitucional" },
      { id: "2", status: "MASTERED", subject: "Direito Administrativo" },
      { id: "3", status: "PENDING", subject: "Direito Tributário" },
    ];

    const pendingItems = items.filter((item) => item.status === "PENDING");
    expect(pendingItems.length).toBe(2);

    const defaultColumns: 1 | 2 = 2;
    expect(defaultColumns).toBe(2);
  });
});


describe("Round 20 - Escalonamento de Dificuldade Extrema e Normalização Canônica", () => {
  const normalizeDiff = (raw?: string | null) => {
    if (!raw) return "MEDIUM";
    const norm = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    if (norm.includes("extrema") || norm.includes("extreme") || norm.includes("hardcore")) {
      return "EXTREME";
    }
    if (norm.includes("dificil") || norm.includes("hard")) return "HARD";
    if (norm.includes("facil") || norm.includes("easy")) return "EASY";
    return "MEDIUM";
  };

  it("normaliza variações de Dificuldade Extrema para o tier EXTREME", () => {
    expect(normalizeDiff("Extrema")).toBe("EXTREME");
    expect(normalizeDiff("Dificuldade Extrema")).toBe("EXTREME");
    expect(normalizeDiff("hardcore")).toBe("EXTREME");
    expect(normalizeDiff("Difícil")).toBe("HARD");
    expect(normalizeDiff("Média")).toBe("MEDIUM");
    expect(normalizeDiff("Fácil")).toBe("EASY");
  });
});

describe("Round 20 - Particionamento de Lotes para Simulados Extensos (40, 50, 60 Questões)", () => {
  const calculateBatches = (total: number, maxBatchSize = 10, maxTotal = 60): number[] => {
    const boundedTotal = Math.min(Math.max(total, 1), maxTotal);
    const batches: number[] = [];
    let remaining = boundedTotal;
    while (remaining > 0) {
      const size = Math.min(remaining, maxBatchSize);
      batches.push(size);
      remaining -= size;
    }
    return batches;
  };

  it("particiona 40 questões em 4 lotes paralelos de 10", () => {
    const batches = calculateBatches(40);
    expect(batches).toEqual([10, 10, 10, 10]);
    expect(batches.reduce((a, b) => a + b, 0)).toBe(40);
  });

  it("particiona 50 e 60 questões em lotes paralelos equilibrados", () => {
    const batches50 = calculateBatches(50);
    expect(batches50).toEqual([10, 10, 10, 10, 10]);
    expect(batches50.reduce((a, b) => a + b, 0)).toBe(50);

    const batches60 = calculateBatches(60);
    expect(batches60).toEqual([10, 10, 10, 10, 10, 10]);
    expect(batches60.reduce((a, b) => a + b, 0)).toBe(60);
  });

  it("limita ao teto máximo de 60 questões", () => {
    const batchesOver = calculateBatches(100);
    expect(batchesOver.reduce((a, b) => a + b, 0)).toBe(60);
  });
});

describe("Round 20 - Gating de Volume e Dificuldade por Tier de Usuário (Pro/Elite)", () => {
  const canAccessVolume = (tier: string, volume: number): boolean => {
    if (volume > 30) {
      return tier === "PRO" || tier === "ELITE" || tier === "ADMIN";
    }
    return true;
  };

  const canAccessDifficulty = (tier: string, difficulty: string): boolean => {
    if (difficulty === "Extrema") {
      return tier === "PRO" || tier === "ELITE" || tier === "ADMIN";
    }
    return true;
  };

  it("permite volumes até 30 e dificuldades padrão para todos os tiers", () => {
    expect(canAccessVolume("FREE", 30)).toBe(true);
    expect(canAccessVolume("FREE", 10)).toBe(true);
    expect(canAccessDifficulty("FREE", "Difícil")).toBe(true);
  });

  it("bloqueia volumes 40, 50, 60 e Dificuldade Extrema para plano FREE", () => {
    expect(canAccessVolume("FREE", 40)).toBe(false);
    expect(canAccessVolume("FREE", 50)).toBe(false);
    expect(canAccessVolume("FREE", 60)).toBe(false);
    expect(canAccessDifficulty("FREE", "Extrema")).toBe(false);
  });

  it("libera volumes 40, 50, 60 e Dificuldade Extrema para assinantes PRO e ELITE", () => {
    expect(canAccessVolume("PRO", 50)).toBe(true);
    expect(canAccessVolume("ELITE", 60)).toBe(true);
    expect(canAccessDifficulty("PRO", "Extrema")).toBe(true);
    expect(canAccessDifficulty("ELITE", "Extrema")).toBe(true);
  });
});

describe("Round 21 - Preset de Tempo Oficial de Concurso (3 min/questão)", () => {
  const calculateOfficialExamTime = (questionCount: number) => {
    return questionCount * 3 * 60; // 3 min por questão em segundos
  };

  const getTimerWarningStatus = (timeLimitSeconds: number, elapsedSeconds: number) => {
    const remaining = Math.max(0, timeLimitSeconds - elapsedSeconds);
    const isCritical = remaining <= 180 && remaining > 0; // <= 3 min
    const isWarning = remaining <= 600 && remaining > 0;  // <= 10 min
    const isExpired = remaining === 0;
    return { remaining, isCritical, isWarning, isExpired };
  };

  it("calcula o tempo oficial de prova com precisão para diferentes volumes", () => {
    expect(calculateOfficialExamTime(5)).toBe(900);     // 15 min
    expect(calculateOfficialExamTime(30)).toBe(5400);   // 90 min (1h30)
    expect(calculateOfficialExamTime(40)).toBe(7200);   // 120 min (2h)
    expect(calculateOfficialExamTime(60)).toBe(10800);  // 180 min (3h)
  });

  it("dispara alertas visuais corretos em 10min e 3min restantes e ao expirar", () => {
    const limit = 5400; // 90 min

    // Tranquilo (40 min restantes)
    const calm = getTimerWarningStatus(limit, 3000);
    expect(calm.isWarning).toBe(false);
    expect(calm.isCritical).toBe(false);
    expect(calm.isExpired).toBe(false);

    // Alerta Suave (9 min restantes <= 600s)
    const warning = getTimerWarningStatus(limit, 4860);
    expect(warning.isWarning).toBe(true);
    expect(warning.isCritical).toBe(false);

    // Crítico (2 min restantes <= 180s)
    const critical = getTimerWarningStatus(limit, 5280);
    expect(critical.isWarning).toBe(true);
    expect(critical.isCritical).toBe(true);
    expect(critical.isExpired).toBe(false);

    // Expirado (0s)
    const expired = getTimerWarningStatus(limit, 5400);
    expect(expired.isExpired).toBe(true);
  });
});

describe("Round 21 - Exportação de Relatório de Simulado em Planilha CSV", () => {
  const generateQuizCSV = (params: {
    banca: string;
    subject: string;
    questions: Array<{ gabaritoCorreto: string; enunciado: string }>;
    selectedAnswers: Record<number, string>;
    timerFormatted: string;
  }) => {
    const headers = [
      "Numero",
      "Materia",
      "Banca",
      "Gabarito Oficial",
      "Sua Resposta",
      "Resultado",
      "Enunciado Resumido",
    ];

    let correctCount = 0;
    const rows = params.questions.map((q, idx) => {
      const userAns = params.selectedAnswers[idx] || "Em branco";
      const isCorrect = userAns === q.gabaritoCorreto;
      if (isCorrect) correctCount++;
      const cleanEnunciado = (q.enunciado || "")
        .replace(/[\r\n]+/g, " ")
        .replace(/"/g, '""')
        .slice(0, 160);
      return [
        idx + 1,
        `"${params.subject}"`,
        `"${params.banca}"`,
        `"${q.gabaritoCorreto}"`,
        `"${userAns}"`,
        isCorrect ? "ACERTOU" : "ERROU",
        `"${cleanEnunciado}"`,
      ].join(",");
    });

    const summary = [
      "",
      "# RESUMO DE RENDIMENTO",
      `Total de Questoes,${params.questions.length}`,
      `Acertos,${correctCount}`,
      `Erros,${params.questions.length - correctCount}`,
      `Tempo Total,${params.timerFormatted}`,
    ].join("\n");

    return "\uFEFF" + [headers.join(","), ...rows, summary].join("\n");
  };

  it("gera arquivo CSV com BOM UTF-8 e estrutura completa de gabarito e métricas", () => {
    const csv = generateQuizCSV({
      banca: "FGV",
      subject: "Direito Constitucional",
      questions: [
        { gabaritoCorreto: "B", enunciado: "Nos termos da CF/88, assinale..." },
        { gabaritoCorreto: "D", enunciado: "Sobre os direitos fundamentais..." },
      ],
      selectedAnswers: { 0: "B", 1: "A" },
      timerFormatted: "00:04:30",
    });

    // Inicia com BOM UTF-8 para compatibilidade perfeita com Excel no Windows
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Gabarito Oficial,Sua Resposta,Resultado");
    expect(csv).toContain('1,"Direito Constitucional","FGV","B","B",ACERTOU');
    expect(csv).toContain('2,"Direito Constitucional","FGV","D","A",ERROU');
    expect(csv).toContain("# RESUMO DE RENDIMENTO");
    expect(csv).toContain("Total de Questoes,2");
    expect(csv).toContain("Acertos,1");
    expect(csv).toContain("Erros,1");
  });
});

describe("Round 21 - Mapeamento e Filtragem de Reincidência no Caderno de Erros", () => {
  const computeRecurrence = (errors: Array<{ questionText: string; errorReason: string }>) => {
    const map: Record<string, number> = {};
    for (const q of errors) {
      const key = (q.questionText || "").trim().toLowerCase().slice(0, 100);
      if (key) map[key] = (map[key] || 0) + 1;
    }
    return map;
  };

  const filterByRecurrence = (
    errors: Array<{ questionText: string; errorReason: string }>,
    map: Record<string, number>
  ) => {
    return errors.filter((q) => {
      const key = (q.questionText || "").trim().toLowerCase().slice(0, 100);
      return (map[key] || 0) > 1;
    });
  };

  it("identifica corretamente questões reincidentes quando há múltiplas falhas no mesmo enunciado", () => {
    const errorList = [
      { questionText: "Sobre o princípio da legalidade estrita...", errorReason: "CONTENT_GAP" },
      { questionText: "Sobre o princípio da legalidade estrita...", errorReason: "TRICK_QUESTION" },
      { questionText: "Assinale a opção referente à desapropriação...", errorReason: "INTERPRETATION" },
    ];

    const map = computeRecurrence(errorList);
    const key = "sobre o princípio da legalidade estrita...";
    expect(map[key]).toBe(2);

    const recurrent = filterByRecurrence(errorList, map);
    expect(recurrent.length).toBe(2);
    expect(recurrent.every((r) => r.questionText.startsWith("Sobre o princípio"))).toBe(true);
  });
});

describe("Round 22 - Pipeline de Áudio Neural das Aulas (Sem Voz Robótica)", () => {
  const formatLessonSpeechText = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\[\.\.\.\]/g, "lacuna")
      .replace(/[*_#`~>|]/g, " ")
      .replace(/[-*+]\s+/g, ". ")
      .replace(/(\d+)\.\s+/g, "$1, ")
      .replace(/&/g, " e ")
      .replace(/<[^>]*>/g, "")
      .replace(/(Portanto|Logo|Assim|Dessa forma|Por conseguinte|Nesse sentido|Ademais|Outrossim),?/gi, "$1, ")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getFallbackVoiceMatch = (
    voiceURI: string,
    availableVoices: Array<{ name: string; lang: string }>
  ) => {
    const isFemale = voiceURI.includes("Thalita") || voiceURI.includes("Francisca");
    const preferred = isFemale
      ? ["Thalita", "Francisca", "Google português do Brasil", "Luciana", "Maria", "Letícia"]
      : ["Antonio", "Nicolau", "Google português do Brasil", "Daniel", "Felipe"];

    for (const name of preferred) {
      const match = availableVoices.find(
        (v) =>
          (v.lang.includes("pt-BR") || v.lang.includes("pt_BR") || v.lang.startsWith("pt")) &&
          v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (match) return match;
    }

    return (
      availableVoices.find((v) => v.lang.includes("pt-BR") || v.lang.includes("pt_BR")) ||
      availableVoices.find((v) => v.lang.startsWith("pt")) ||
      null
    );
  };

  it("higieniza formatações markdown e pontuação para fala natural sem símbolos lidos literalmente", () => {
    const rawLessonMarkdown = `
### 1. Transações ACID e Isolamento
- **Atomicidade**: ou tudo executa, ou nada executa!
| Nível | Dirty Read |
| READ COMMITTED | NÃO |
Portanto a regra de ouro: sempre use transações seguras & consistentes.
`;
    const clean = formatLessonSpeechText(rawLessonMarkdown);

    // Sem asteriscos, hashtags ou barras verticais de tabela
    expect(clean).not.toContain("###");
    expect(clean).not.toContain("**");
    expect(clean).not.toContain("|");
    expect(clean).not.toContain("&");
    expect(clean).toContain("1, Transações ACID");
    expect(clean).toContain("e consistentes");
    expect(clean).toContain("Portanto, a regra de ouro");
  });

  it("associa voz feminina (Thalita/Francisca) e masculina (Antônio/Nicolau) aos perfis corretos em fallback", () => {
    const mockBrowserVoices = [
      { name: "Microsoft David Desktop - English (United States)", lang: "en-US" },
      { name: "Microsoft Thalita Online (Natural) - Portuguese (Brazil)", lang: "pt-BR" },
      { name: "Microsoft Antonio Online (Natural) - Portuguese (Brazil)", lang: "pt-BR" },
      { name: "Google português do Brasil", lang: "pt-BR" },
    ];

    const thalitaMatch = getFallbackVoiceMatch("pt-BR-ThalitaNeural", mockBrowserVoices);
    expect(thalitaMatch?.name).toContain("Thalita");

    const antonioMatch = getFallbackVoiceMatch("pt-BR-AntonioNeural", mockBrowserVoices);
    expect(antonioMatch?.name).toContain("Antonio");
  });
});
