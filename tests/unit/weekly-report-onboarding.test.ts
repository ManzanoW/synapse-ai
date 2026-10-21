// tests/unit/weekly-report-onboarding.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { addOnboardingActivationBonus } from "@/lib/ai-quota-service";
import { claimOnboardingRewardAction } from "@/actions/gamification-actions";
import { getWeeklyPerformanceReportAction } from "@/actions/analytics-actions";

// Mock do auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-test-weekly", name: "Guilherme Santos", email: "guilherme@synapse.ai" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-service", () => ({
  getCachedUserStats: vi.fn().mockResolvedValue({
    totalXp: 350,
    streakDays: 4,
    claimedAchievements: "",
  }),
  getCachedAchievementsProgress: vi.fn().mockResolvedValue([]),
}));

// Mock do Prisma
const mockUpsertUsage = vi.fn().mockResolvedValue({ count: 2 });
const mockFindManySessions = vi.fn();
const mockFindManyQuizzes = vi.fn();
const mockCountErrors = vi.fn();
const mockCountFlashcards = vi.fn();
const mockFindUniqueUser = vi.fn();
const mockFindUniqueStats = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiDailyUsage: {
      upsert: (...args: any[]) => mockUpsertUsage(...args),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: (...args: any[]) => mockFindUniqueUser(...args),
    },
    userStats: {
      findUnique: (...args: any[]) => mockFindUniqueStats(...args),
      upsert: vi.fn().mockResolvedValue({ totalXp: 450, claimedAchievements: "FIRST_STEPS_COMPLETED" }),
    },
    studySession: {
      create: vi.fn().mockResolvedValue({ id: "session-onboarding" }),
      findMany: (...args: any[]) => mockFindManySessions(...args),
    },
    quizAttempt: {
      findMany: (...args: any[]) => mockFindManyQuizzes(...args),
    },
    questionError: {
      count: (...args: any[]) => mockCountErrors(...args),
    },
    flashcard: {
      count: (...args: any[]) => mockCountFlashcards(...args),
    },
    $transaction: vi.fn((promises: any[]) => Promise.all(promises)),
  },
}));

describe("Onboarding Gamificado com Duplo Bônus (+100 XP e +2⚡ Sinapses)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addOnboardingActivationBonus credita 2 Sinapses em BONUS_ONBOARDING e BONUS_ALL", async () => {
    const res = await addOnboardingActivationBonus("user-test-weekly");
    expect(res.success).toBe(true);
    expect(res.earnedEnergy).toBe(2);
    expect(res.message).toContain("+2⚡");
    expect(mockUpsertUsage).toHaveBeenCalledTimes(2);
  });

  it("claimOnboardingRewardAction concede 100 XP e 2 Sinapses na conclusão das primeiras conquistas", async () => {
    const res = await claimOnboardingRewardAction();
    expect(res.success).toBe(true);
    expect(res.earnedXp).toBe(100);
    expect(res.earnedSynapses).toBe(2);
    expect(res.alreadyClaimed).toBe(false);
  });
});

describe("Boletim Semanal do Concurseiro (Card Visual Compartilhável)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueUser.mockResolvedValue({
      name: "Guilherme Santos",
      email: "guilherme@synapse.ai",
    });
    mockFindUniqueStats.mockResolvedValue({
      streakDays: 6,
      totalXp: 1250,
    });
  });

  it("compila métricas semanais com precisão alta e atribui arquétipo Sniper de Questões", async () => {
    mockFindManySessions.mockResolvedValue([
      { durationMinutes: 60 },
      { durationMinutes: 45 },
      { durationMinutes: 75 },
    ]);
    mockFindManyQuizzes.mockResolvedValue([
      { totalCount: 20, correctCount: 18 },
      { totalCount: 10, correctCount: 8 },
    ]);
    mockCountErrors.mockResolvedValue(4);
    mockCountFlashcards.mockResolvedValue(35);

    const report = await getWeeklyPerformanceReportAction();

    expect(report.success).toBe(true);
    expect(report.data).toBeDefined();

    if (report.data) {
      expect(report.data.userName).toBe("Guilherme");
      expect(report.data.totalMinutes).toBe(180);
      expect(report.data.totalHoursFormatted).toBe("3h");
      expect(report.data.sessionsCount).toBe(3);
      expect(report.data.questionsTotal).toBe(30);
      expect(report.data.questionsCorrect).toBe(26);
      expect(report.data.accuracyPercentage).toBe(87);
      expect(report.data.masteredErrorsCount).toBe(4);
      expect(report.data.streakDays).toBe(6);
      expect(report.data.flashcardsReviewed).toBe(35);
      // Taxa >= 80% com >= 10 questões => Sniper de Questões
      expect(report.data.archetype.title).toContain("Sniper de Questões");
      expect(report.data.archetype.badge).toBe("Alta Precisão");
    }
  });

  it("atribui arquétipo Máquina de Foco quando usuário acumula mais de 10 horas de estudo na semana", async () => {
    mockFindManySessions.mockResolvedValue([
      { durationMinutes: 240 },
      { durationMinutes: 240 },
      { durationMinutes: 180 },
    ]); // 660 minutos = 11 horas
    mockFindManyQuizzes.mockResolvedValue([
      { totalCount: 10, correctCount: 6 }, // 60% acertos
    ]);
    mockCountErrors.mockResolvedValue(1);
    mockCountFlashcards.mockResolvedValue(10);

    const report = await getWeeklyPerformanceReportAction();

    expect(report.success).toBe(true);
    expect(report.data).toBeDefined();

    if (report.data) {
      expect(report.data.totalMinutes).toBe(660);
      expect(report.data.totalHoursFormatted).toBe("11h");
      expect(report.data.accuracyPercentage).toBe(60);
      // Mais de 600 min => Máquina de Foco
      expect(report.data.archetype.title).toContain("Máquina de Foco");
      expect(report.data.archetype.badge).toBe("Hiperfoco Absoluto");
    }
  });

  it("atribui arquétipo Mente Resiliente quando usuário cicatriza 5 ou mais erros no caderno", async () => {
    mockFindManySessions.mockResolvedValue([
      { durationMinutes: 120 },
    ]);
    mockFindManyQuizzes.mockResolvedValue([
      { totalCount: 8, correctCount: 5 },
    ]);
    mockCountErrors.mockResolvedValue(7);
    mockCountFlashcards.mockResolvedValue(12);

    const report = await getWeeklyPerformanceReportAction();

    expect(report.success).toBe(true);
    expect(report.data).toBeDefined();

    if (report.data) {
      expect(report.data.masteredErrorsCount).toBe(7);
      expect(report.data.archetype.title).toContain("Mente Resiliente");
      expect(report.data.archetype.badge).toBe("Blindagem Cognitiva");
    }
  });
});
