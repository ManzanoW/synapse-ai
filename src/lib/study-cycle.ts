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

/**
 * Função utilitária para calcular o próximo intervalo SM-2 ponderado pelo Peso do Edital
 */
export function calculateSM2Interval(
  currentInterval: number,
  easinessFactor: number,
  grade: number, // Nota de 0 a 5
  subjectPriority: number, // Peso do edital (ex: 1.0 a 10.0)
): { newInterval: number; newEasiness: Float32Array | number } {
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

  // Ajuste por prioridade: Matérias de peso maior reduzem o intervalo para aparecer mais vezes
  const priorityFactor = Math.max(0.4, 2.0 / Math.max(subjectPriority, 0.5));
  const newInterval = Math.max(1, Math.round(baseInterval * priorityFactor));

  return { newInterval, newEasiness };
}

export function processSM2Review(
  currentInterval: number,
  currentEasiness: number,
  currentRepetitions: number,
  grade: number, // 0 a 5
  subjectPriority: number = 6.3,
): SM2UpdateResult {
  // 1. Atualiza Fator de Facilidade (Easiness)
  let newEasiness =
    currentEasiness + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEasiness < 1.3) newEasiness = 1.3;

  let newInterval: number;
  let newRepetitions: number;

  // 2. Se a nota for baixa (< 3), reseta a contagem de repetições (Errou)
  if (grade < 3) {
    newRepetitions = 0;
    newInterval = 1; // Revisa no dia seguinte
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

  // 3. Ajuste Ponderado pelo Peso do Edital (Priority)
  // Quanto maior o peso, menor o intervalo entre revisões para manter o conteúdo fresco
  const priorityFactor = Math.max(0.4, 2.0 / Math.max(subjectPriority, 0.5));
  const finalInterval = Math.max(1, Math.round(newInterval * priorityFactor));

  // 4. Calcula a Próxima Data de Revisão
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
 * MÓDULO 1: Cronograma Semanal (Respeita AssignedDay e calcula urgência pelo peso/SM-2)
 */
export function buildWeeklySchedule(
  subjects: SubjectInput[],
  weeklyGoalHours: number,
  activeDaysPerWeek: number,
) {
  if (!subjects.length || activeDaysPerWeek <= 0) {
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

  const totalWeeklyMinutes = weeklyGoalHours * 60;
  const totalPriority = subjects.reduce((acc, s) => acc + (s.priority || 1), 0);

  // 1. Visão Geral da Carga Horária por Matéria
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

  // 2. Ordenação de urgência SM-2 Ponderada para as matérias dinâmicas
  const now = new Date().getTime();
  const sortedDynamicSubjects = [...subjects]
    .filter((s) => s.assignedDay === null || s.assignedDay === undefined)
    .sort((a, b) => {
      const lastA = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
      const lastB = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;
      const daysSinceA = Math.max(1, (now - lastA) / (1000 * 60 * 60 * 24));
      const daysSinceB = Math.max(1, (now - lastB) / (1000 * 60 * 60 * 24));

      // Urgência = Peso * (Dias sem estudar / Intervalo)
      const urgencyA = (a.priority || 1) * (daysSinceA / (a.interval || 1));
      const urgencyB = (b.priority || 1) * (daysSinceB / (b.interval || 1));

      return urgencyB - urgencyA; // Maior urgência primeiro
    });

  const maxSubjectsPerDay = Math.min(
    3,
    Math.max(2, Math.ceil(subjects.length / 2)),
  );

  const topicPointers: Record<string, number> = {};
  subjects.forEach((s) => (topicPointers[s.id] = 0));

  let dynamicSubjectIndex = 0;
  const scheduleByDay: DaySchedule[] = [];

  for (let dayIdx = 0; dayIdx < activeDaysPerWeek; dayIdx++) {
    const dayName = daysOfWeek[dayIdx % daysOfWeek.length];
    const daySubjects: ScheduledSubject[] = [];

    // Busca matérias explicitamente fixadas no dia pelo Swap
    const pinnedSubjects = subjects.filter((s) => s.assignedDay === dayIdx);
    const subjectsForToday: SubjectInput[] = [...pinnedSubjects];

    // Preenche as vagas restantes do dia com matérias dinâmicas por urgência/peso
    while (
      subjectsForToday.length < maxSubjectsPerDay &&
      sortedDynamicSubjects.length > 0
    ) {
      const nextSubject =
        sortedDynamicSubjects[
          dynamicSubjectIndex % sortedDynamicSubjects.length
        ];
      if (!subjectsForToday.some((s) => s.id === nextSubject.id)) {
        subjectsForToday.push(nextSubject);
      }
      dynamicSubjectIndex++;
    }

    const dayTotalMinutes = Math.round(totalWeeklyMinutes / activeDaysPerWeek);
    const dayPrioritySum = subjectsForToday.reduce(
      (acc, s) => acc + (s.priority || 1),
      0,
    );

    subjectsForToday.forEach((subject) => {
      const priority = subject.priority || 1;
      const dailyMinutes = Math.round(
        (dayTotalMinutes * priority) / dayPrioritySum,
      );
      const overview = subjectOverview.find((s) => s.id === subject.id);

      const allTopics = subject.topics || [];
      const pendingTopics = allTopics.filter(
        (t) => !t.firstStudy || t.firstStudy === "Pendente",
      );
      const reviewTopics = allTopics.filter(
        (t) => t.firstStudy === "Em Revisão",
      );

      const availableTopics =
        pendingTopics.length > 0 ? pendingTopics : reviewTopics;
      const assignedTopics: Topic[] = [];

      if (availableTopics.length > 0) {
        const startIdx = topicPointers[subject.id] % availableTopics.length;
        const countToTake = Math.min(
          dailyMinutes >= 45 ? 2 : 1,
          availableTopics.length,
        );

        for (let t = 0; t < countToTake; t++) {
          const topicIndex = (startIdx + t) % availableTopics.length;
          assignedTopics.push(availableTopics[topicIndex]);
        }

        topicPointers[subject.id] += countToTake;
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
 * MÓDULO 2: Ciclo de Estudos
 */
export function buildStudyCycleBlocks(
  subjects: SubjectInput[],
  weeklyGoalHours: number,
  currentIndex: number = 0,
  palette: string[],
) {
  if (!subjects.length) {
    return {
      blocks: [],
      totalBlocks: 0,
      totalMinutes: 0,
      completedBlocks: 0,
      currentProgress: 0,
      subjectBreakdown: [],
    };
  }

  const totalPriority = subjects.reduce((acc, s) => acc + (s.priority || 1), 0);
  const totalWeeklyMinutes = weeklyGoalHours * 60;
  const BLOCK_SIZE_MINUTES = 90;

  const blocks: CycleBlock[] = [];
  let blockCounter = 1;

  const topicPointers: Record<string, number> = {};
  subjects.forEach((s) => (topicPointers[s.id] = 0));

  const subjectBreakdown: {
    id: string;
    name: string;
    color: string;
    allocatedMinutes: number;
    percentage: number;
  }[] = [];

  subjects.forEach((subject, idx) => {
    const priority = subject.priority || 1;
    const allocatedMinutes = Math.round(
      (totalWeeklyMinutes * priority) / totalPriority,
    );
    const percentage = Math.round((priority / totalPriority) * 100);

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
      const startIdx = topicPointers[subject.id] % (allTopics.length || 1);
      const assignedTopics = allTopics.slice(startIdx, startIdx + 2);
      topicPointers[subject.id] += assignedTopics.length;

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
