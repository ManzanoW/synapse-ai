export interface Topic {
  id: string;
  title: string;
  firstStudy?: string;
  relevance?: string | null;
  performance?: number;
}

export interface SubjectInput {
  id: string;
  name: string;
  priority: number;
  color?: string | null;
  assignedDay?: number | null;
  lastReviewed?: Date | string;
  nextReview?: Date | string;
  interval?: number;
  easiness?: number;
  topics?: Topic[];
}

export interface ScheduledSubject extends SubjectInput {
  weeklyMinutesAllocated: number;
  dailyMinutesAllocated: number;
  percentageOfTotal: number;
  assignedTopics: Topic[];
}

export interface DaySchedule {
  dayIndex: number;
  dayName: string;
  totalMinutes: number;
  subjects: ScheduledSubject[];
}

export interface CycleBlock {
  blockNumber: number;
  subjectId: string;
  subjectName: string;
  color: string;
  durationMinutes: number;
  assignedTopics: Topic[];
  status: "COMPLETED" | "CURRENT" | "PENDING";
}

export interface SM2UpdateResult {
  newInterval: number;
  newEasiness: number;
  newRepetitions: number;
  nextReviewDate: Date;
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function calculateSM2Interval(
  currentInterval: number,
  easinessFactor: number,
  grade: number,
  subjectPriority: number,
): { newInterval: number; newEasiness: number } {
  let newEasiness =
    easinessFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEasiness < 1.3) newEasiness = 1.3;

  let baseInterval: number;
  if (grade < 3) {
    baseInterval = 1;
  } else if (currentInterval === 0) {
    baseInterval = 1;
  } else if (currentInterval === 1) {
    baseInterval = 6;
  } else {
    baseInterval = Math.round(currentInterval * newEasiness);
  }

  const priorityFactor = Math.max(0.4, 2.0 / Math.max(subjectPriority, 0.5));
  const newInterval = Math.max(1, Math.round(baseInterval * priorityFactor));

  return { newInterval, newEasiness: Number(newEasiness.toFixed(2)) };
}

export function processSM2Review(
  currentInterval: number,
  currentEasiness: number,
  currentRepetitions: number,
  grade: number,
  subjectPriority: number = 6.3,
): SM2UpdateResult {
  let newEasiness =
    currentEasiness + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEasiness < 1.3) newEasiness = 1.3;

  let newInterval: number;
  let newRepetitions: number;

  if (grade < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = currentRepetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEasiness);
    }
  }

  const priorityFactor = Math.max(0.4, 2.0 / Math.max(subjectPriority, 0.5));
  const finalInterval = Math.max(1, Math.round(newInterval * priorityFactor));

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + finalInterval);

  return {
    newInterval: finalInterval,
    newEasiness: Number(newEasiness.toFixed(2)),
    newRepetitions,
    nextReviewDate,
  };
}

/**
 * Função Auxiliar de Calculo do Score de Urgência SM-2
 */
function getSM2UrgencyScore(
  subject: SubjectInput,
  nowTimestamp: number,
): number {
  const nextTime = subject.nextReview
    ? new Date(subject.nextReview).getTime()
    : 0;

  // Fator de atraso (Overdue)
  const overdueDays =
    nextTime > 0
      ? Math.max(0, (nowTimestamp - nextTime) / (1000 * 60 * 60 * 24))
      : 0;

  // Dificuldade calculada pelo Easiness Factor do SM-2
  const easiness = subject.easiness || 2.5;
  const difficultyMultiplier = 2.5 / Math.max(1.3, easiness);

  // Score = (Prioridade base + Peso de atraso em dias) * Multiplicador de retenção
  return ((subject.priority || 1) + overdueDays * 1.5) * difficultyMultiplier;
}

/**
 * MÓDULO 1: Cronograma Semanal (Dinamizado pelo SM-2)
 */
export function buildWeeklySchedule(
  subjects: SubjectInput[],
  weeklyGoalHours: number,
  activeDaysPerWeek: number,
) {
  if (!subjects || !subjects.length || activeDaysPerWeek <= 0) {
    return { scheduleByDay: [], subjectOverview: [] };
  }

  const daysOfWeek = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
  ];

  const totalWeeklyMinutes = Math.max(1, weeklyGoalHours * 60);
  const totalPriority = subjects.reduce((acc, s) => acc + (s.priority || 1), 0);

  const subjectOverview = subjects.map((subject) => {
    const priority = subject.priority || 1;
    const percentage = Math.round((priority / totalPriority) * 100);
    const weeklyMinutes = Math.round(
      (totalWeeklyMinutes * priority) / totalPriority,
    );

    return {
      ...subject,
      percentageOfTotal: percentage,
      weeklyMinutesAllocated: weeklyMinutes,
    };
  });

  // SANITIZAÇÃO: Se mais de 50% das matérias têm o mesmo assignedDay, consideramos erro no banco e resetamos localmente
  const assignedDaysCount: Record<number, number> = {};
  subjects.forEach((s) => {
    if (s.assignedDay !== null && s.assignedDay !== undefined) {
      assignedDaysCount[s.assignedDay] =
        (assignedDaysCount[s.assignedDay] || 0) + 1;
    }
  });

  const hasCorruptedAssignedDays = Object.values(assignedDaysCount).some(
    (count) => count >= Math.ceil(subjects.length / 2) && subjects.length > 2,
  );

  const sanitizedSubjects = subjects.map((s) => ({
    ...s,
    assignedDay: hasCorruptedAssignedDays ? null : s.assignedDay,
  }));

  const now = new Date().getTime();

  // Ordenação Dinâmica Unificada baseada no SM-2
  const sortedSubjects = [...sanitizedSubjects].sort((a, b) => {
    const scoreA = getSM2UrgencyScore(a, now);
    const scoreB = getSM2UrgencyScore(b, now);
    return scoreB - scoreA;
  });

  const daysSubjectsMap: SubjectInput[][] = Array.from(
    { length: activeDaysPerWeek },
    () => [],
  );

  // Define limite rígido por dia
  const maxSubjectsPerDay = Math.min(
    3,
    Math.max(2, Math.ceil(sanitizedSubjects.length / activeDaysPerWeek)),
  );

  // Distribuição Round-Robin entre os dias
  let subjectPointer = 0;

  for (let pass = 0; pass < maxSubjectsPerDay; pass++) {
    for (let dayIdx = 0; dayIdx < activeDaysPerWeek; dayIdx++) {
      if (daysSubjectsMap[dayIdx].length >= maxSubjectsPerDay) continue;

      let attempts = 0;
      while (attempts < sortedSubjects.length) {
        const candidate =
          sortedSubjects[subjectPointer % sortedSubjects.length];
        subjectPointer++;
        attempts++;

        if (!daysSubjectsMap[dayIdx].some((s) => s.id === candidate.id)) {
          daysSubjectsMap[dayIdx].push(candidate);
          break;
        }
      }
    }
  }

  // 🟢 MONTAGEM FINAL DO CRONOGRAMA COM PONTEIROS DE TÓPICOS GLOBAIS
  const topicPointers: Record<string, number> = {};
  sanitizedSubjects.forEach((s) => (topicPointers[s.id] = 0));

  const scheduleByDay: DaySchedule[] = [];
  const dayTotalMinutes = Math.round(totalWeeklyMinutes / activeDaysPerWeek);

  for (let dayIdx = 0; dayIdx < activeDaysPerWeek; dayIdx++) {
    const dayName = daysOfWeek[dayIdx % daysOfWeek.length];

    const subjectsForToday = daysSubjectsMap[dayIdx].slice(
      0,
      maxSubjectsPerDay,
    );

    const dayPrioritySum = subjectsForToday.reduce(
      (acc, s) => acc + (s.priority || 1),
      0,
    );

    const daySubjects: ScheduledSubject[] = [];

    subjectsForToday.forEach((subject) => {
      const priority = subject.priority || 1;
      const dailyMinutes = Math.round(
        (dayTotalMinutes * priority) / Math.max(1, dayPrioritySum),
      );
      const overview = subjectOverview.find((s) => s.id === subject.id);

      // --- DISTRIBUIÇÃO SEQUENCIAL SEM DUPLICAR NA SEMANA ---
      const allTopics = subject.topics || [];
      const assignedTopics: Topic[] = [];

      if (allTopics.length > 0) {
        const targetTopicCount =
          dailyMinutes >= 90 ? 3 : dailyMinutes >= 45 ? 2 : 1;

        // Pega os tópicos em ordem sequencial usando o ponteiro global da matéria
        const currentPointer = topicPointers[subject.id] || 0;

        for (let t = 0; t < targetTopicCount; t++) {
          const topicIndex = (currentPointer + t) % allTopics.length;
          assignedTopics.push(allTopics[topicIndex]);
        }

        // Avança o ponteiro global da matéria para o próximo dia em que ela for estudada
        topicPointers[subject.id] = currentPointer + assignedTopics.length;
      }

      daySubjects.push({
        ...subject,
        weeklyMinutesAllocated: overview?.weeklyMinutesAllocated || 0,
        dailyMinutesAllocated: dailyMinutes,
        percentageOfTotal: overview?.percentageOfTotal || 0,
        assignedTopics,
      });
    });

    scheduleByDay.push({
      dayIndex: dayIdx,
      dayName,
      totalMinutes: dayTotalMinutes,
      subjects: daySubjects,
    });
  }

  return { scheduleByDay, subjectOverview };
}

/**
 * MÓDULO 2: Ciclo de Estudos (Sincronizado com Priorização do SM-2)
 */
export function buildStudyCycleBlocks(
  subjects: SubjectInput[],
  weeklyGoalHours: number,
  currentIndex: number = 0,
  palette: string[],
) {
  if (!subjects || !subjects.length) {
    return {
      blocks: [],
      totalBlocks: 0,
      totalMinutes: 0,
      completedBlocks: 0,
      currentProgress: 0,
      subjectBreakdown: [],
    };
  }

  const now = new Date().getTime();

  // Sincroniza a ordem dos blocos do ciclo com o mesmo algoritmo SM-2 da Visão Semanal
  const sortedSubjects = [...subjects].sort((a, b) => {
    const scoreA = getSM2UrgencyScore(a, now);
    const scoreB = getSM2UrgencyScore(b, now);
    return scoreB - scoreA;
  });

  const totalPriority = sortedSubjects.reduce(
    (acc, s) => acc + (s.priority || 1),
    0,
  );
  const totalWeeklyMinutes = Math.max(1, weeklyGoalHours * 60);
  const BLOCK_SIZE_MINUTES = 90;

  const blocks: CycleBlock[] = [];
  let blockCounter = 1;

  const topicPointers: Record<string, number> = {};
  sortedSubjects.forEach((s) => (topicPointers[s.id] = 0));

  const subjectBreakdown: {
    id: string;
    name: string;
    color: string;
    allocatedMinutes: number;
    percentage: number;
  }[] = [];

  sortedSubjects.forEach((subject, idx) => {
    const priority = subject.priority || 1;
    const allocatedMinutes = Math.round(
      (totalWeeklyMinutes * priority) / Math.max(1, totalPriority),
    );
    const percentage = Math.round(
      (priority / Math.max(1, totalPriority)) * 100,
    );

    const subjectColor =
      subject.color && subject.color.startsWith("#")
        ? subject.color
        : palette[idx % palette.length];

    subjectBreakdown.push({
      id: subject.id,
      name: subject.name,
      color: subjectColor,
      allocatedMinutes,
      percentage,
    });

    const numberOfBlocks = Math.max(
      1,
      Math.round(allocatedMinutes / BLOCK_SIZE_MINUTES),
    );
    const blockDuration = Math.round(allocatedMinutes / numberOfBlocks);

    const allTopics = subject.topics || [];

    for (let b = 0; b < numberOfBlocks; b++) {
      let assignedTopics: Topic[] = [];

      if (allTopics.length > 0) {
        const startIdx = topicPointers[subject.id] % allTopics.length;
        assignedTopics = allTopics.slice(startIdx, startIdx + 2);
        topicPointers[subject.id] += assignedTopics.length;
      }

      let status: "COMPLETED" | "CURRENT" | "PENDING" = "PENDING";
      if (blockCounter - 1 < currentIndex) status = "COMPLETED";
      else if (blockCounter - 1 === currentIndex) status = "CURRENT";

      blocks.push({
        blockNumber: blockCounter,
        subjectId: subject.id,
        subjectName: subject.name,
        color: subjectColor,
        durationMinutes: blockDuration,
        assignedTopics,
        status,
      });

      blockCounter++;
    }
  });

  const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const completedBlocks = blocks.filter((b) => b.status === "COMPLETED").length;
  const currentProgress = blocks.length
    ? Math.round((completedBlocks / blocks.length) * 100)
    : 0;

  return {
    blocks,
    totalBlocks: blocks.length,
    totalMinutes,
    completedBlocks,
    currentProgress,
    subjectBreakdown,
  };
}
