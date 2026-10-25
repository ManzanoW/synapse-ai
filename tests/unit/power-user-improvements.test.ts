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
