import { calculateSM2 } from "@/lib/sm2";

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
  allocatedMinutes?: number;
  targetWeeklyMinutes?: number;
  accuracyPercentage?: number;
  performance?: number;
  deficit?: number;
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
  const result = calculateSM2({
    interval: currentInterval,
    easiness: easinessFactor,
    repetitions: currentInterval > 0 ? 1 : 0,
    grade,
  });

  const priorityFactor = Math.max(0.4, 2.0 / Math.max(subjectPriority, 0.5));
  const newInterval = Math.max(1, Math.round(result.nextInterval * priorityFactor));

  return { newInterval, newEasiness: result.nextEasiness };
}

export function processSM2Review(
  currentInterval: number,
  currentEasiness: number,
  currentRepetitions: number,
  grade: number,
  subjectPriority: number = 6.3,
): SM2UpdateResult {
  const result = calculateSM2({
    interval: currentInterval,
    easiness: currentEasiness,
    repetitions: currentRepetitions,
    grade,
  });

  const priorityFactor = Math.max(0.4, 2.0 / Math.max(subjectPriority, 0.5));
  const finalInterval = Math.max(1, Math.round(result.nextInterval * priorityFactor));

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + finalInterval);

  return {
    newInterval: finalInterval,
    newEasiness: result.nextEasiness,
    newRepetitions: result.nextRepetitions,
    nextReviewDate,
  };
}

/**
 * Função Auxiliar de Cálculo do Score de Urgência SM-2
 */
function getSM2UrgencyScore(
  subject: SubjectInput,
  nowTimestamp: number,
): number {
  const nextTime = subject.nextReview
    ? new Date(subject.nextReview).getTime()
    : 0;

  const overdueDays =
    nextTime > 0
      ? Math.max(0, (nowTimestamp - nextTime) / (1000 * 60 * 60 * 24))
      : 0;

  const easiness = subject.easiness || 2.5;
  const difficultyMultiplier = 2.5 / Math.max(1.3, easiness);

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

  const sortedSubjects = [...sanitizedSubjects].sort((a, b) => {
    const scoreA = getSM2UrgencyScore(a, now);
    const scoreB = getSM2UrgencyScore(b, now);
    return scoreB - scoreA;
  });

  const daysSubjectsMap: SubjectInput[][] = Array.from(
    { length: activeDaysPerWeek },
    () => [],
  );

  const maxSubjectsPerDay = Math.min(
    3,
    Math.max(2, Math.ceil(sanitizedSubjects.length / activeDaysPerWeek)),
  );

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

      const allTopics = subject.topics || [];
      const assignedTopics: Topic[] = [];

      if (allTopics.length > 0) {
        const targetTopicCount =
          dailyMinutes >= 90 ? 3 : dailyMinutes >= 45 ? 2 : 1;

        const currentPointer = topicPointers[subject.id] || 0;

        for (let t = 0; t < targetTopicCount; t++) {
          const topicIndex = (currentPointer + t) % allTopics.length;
          assignedTopics.push(allTopics[topicIndex]);
        }

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
 * MÓDULO 2: Ciclo de Estudos (Sincronizado com Priorização e Calibragem Adaptativa)
 */

interface BlockDraft {
  subjectId: string;
  subjectName: string;
  color: string;
  durationMinutes: number;
  assignedTopics: Topic[];
}

/**
 * Calcula o score de déficit de desempenho da matéria (0.0 a 1.0).
 * Avalia:
 * 1. Déficit explícito no objeto (se informado)
 * 2. Acurácia ou desempenho histórico (< 70% padrão de corte do Synapse AI)
 * 3. Média dos desempenhos dos tópicos vinculados
 * 4. Fator de facilidade SM-2 (easiness < 2.5)
 */
export function calculateSubjectDeficit(subject: SubjectInput): number {
  if (typeof subject.deficit === "number") {
    return Math.max(0, Math.min(1, subject.deficit));
  }

  let accuracy: number | null = null;
  if (typeof subject.accuracyPercentage === "number") {
    accuracy = subject.accuracyPercentage;
  } else if (typeof subject.performance === "number") {
    accuracy = subject.performance;
  } else if (subject.topics && subject.topics.length > 0) {
    const scoredTopics = subject.topics.filter(
      (t) => typeof t.performance === "number" && !isNaN(t.performance),
    );
    if (scoredTopics.length > 0) {
      accuracy =
        scoredTopics.reduce((sum, t) => sum + (t.performance || 0), 0) /
        scoredTopics.length;
    }
  }

  let deficit = 0;
  if (accuracy !== null) {
    if (accuracy < 70) {
      deficit = Math.min(1, (70 - accuracy) / 70);
    }
  }

  const easiness = subject.easiness || 2.5;
  if (easiness < 2.5) {
    deficit += ((2.5 - Math.max(1.3, easiness)) / 2.5) * 0.25;
  }

  return Math.min(1, Math.max(0, deficit));
}

/**
 * Garante que nenhuma matéria tenha mais blocos do que a capacidade matemática de intercalação.
 * Para N blocos totais com >= 2 matérias, nenhuma matéria pode ter mais que ceil(N / 2) blocos.
 */
function balanceBlockDrafts(blocksBySubject: Map<string, BlockDraft[]>): void {
  if (blocksBySubject.size <= 1) return;

  let maxIterations = 25;
  while (maxIterations-- > 0) {
    const totalBlocks = Array.from(blocksBySubject.values()).reduce(
      (sum, list) => sum + list.length,
      0,
    );
    const maxAllowed = Math.ceil(totalBlocks / 2);

    let dominantEntry: [string, BlockDraft[]] | null = null;
    for (const entry of blocksBySubject.entries()) {
      if (entry[1].length > maxAllowed) {
        dominantEntry = entry;
        break;
      }
    }

    if (!dominantEntry) break;

    const [domId, domList] = dominantEntry;

    // 1. Tenta desmembrar bloco de outra matéria se alguma tiver bloco >= 60m
    let splitDone = false;
    for (const [otherId, otherList] of blocksBySubject.entries()) {
      if (otherId === domId) continue;
      const splittableIdx = otherList.findIndex((b) => b.durationMinutes >= 60);
      if (splittableIdx !== -1) {
        const blk = otherList[splittableIdx];
        const half1 = Math.floor(blk.durationMinutes / 2);
        const half2 = blk.durationMinutes - half1;
        const topMid = Math.ceil(blk.assignedTopics.length / 2);

        const newB1: BlockDraft = {
          ...blk,
          durationMinutes: half1,
          assignedTopics: blk.assignedTopics.slice(0, topMid),
        };
        const newB2: BlockDraft = {
          ...blk,
          durationMinutes: half2,
          assignedTopics: blk.assignedTopics.slice(topMid),
        };

        otherList.splice(splittableIdx, 1, newB1, newB2);
        splitDone = true;
        break;
      }
    }

    if (splitDone) continue;

    // 2. Se nenhuma outra puder ser desmembrada, mescla os 2 últimos blocos da dominante
    if (domList.length >= 2) {
      const b2 = domList.pop()!;
      const b1 = domList[domList.length - 1];
      b1.durationMinutes += b2.durationMinutes;
      b1.assignedTopics = [...b1.assignedTopics, ...b2.assignedTopics];
    } else {
      break;
    }
  }
}

/**
 * Algoritmo de Intercalação Inteligente (Interleaving).
 * Garante que matérias consecutivas nunca se repitam: blocks[i].subjectId !== blocks[i+1].subjectId.
 */
function interleaveBlocks(
  blocksBySubject: Map<string, BlockDraft[]>,
  prevSubjectId: string | null = null,
): BlockDraft[] {
  balanceBlockDrafts(blocksBySubject);
  const result: BlockDraft[] = [];
  let currentPrev = prevSubjectId;

  const totalBlocksToPlace = Array.from(blocksBySubject.values()).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  for (let i = 0; i < totalBlocksToPlace; i++) {
    const candidateSubjects = Array.from(blocksBySubject.entries()).filter(
      ([subId, list]) => list.length > 0 && subId !== currentPrev,
    );

    let chosenSubjectId: string | null = null;

    if (candidateSubjects.length > 0) {
      candidateSubjects.sort((a, b) => {
        if (b[1].length !== a[1].length) {
          return b[1].length - a[1].length;
        }
        const sumDurationA = a[1].reduce((acc, blk) => acc + blk.durationMinutes, 0);
        const sumDurationB = b[1].reduce((acc, blk) => acc + blk.durationMinutes, 0);
        return sumDurationB - sumDurationA;
      });

      chosenSubjectId = candidateSubjects[0][0];
    } else {
      const remainingWithBlocks = Array.from(blocksBySubject.entries()).find(
        ([, list]) => list.length > 0,
      );

      if (!remainingWithBlocks) break;
      chosenSubjectId = remainingWithBlocks[0];

      if (chosenSubjectId === currentPrev && result.length > 0) {
        const block = blocksBySubject.get(chosenSubjectId)!.shift()!;
        let inserted = false;

        for (let j = result.length - 1; j >= 0; j--) {
          const prevMatch = j > 0 && result[j - 1].subjectId === chosenSubjectId;
          const currMatch = result[j].subjectId === chosenSubjectId;
          const nextMatch = j < result.length - 1 && result[j + 1]?.subjectId === chosenSubjectId;

          if (!prevMatch && !currMatch && !nextMatch) {
            result.splice(j, 0, block);
            inserted = true;
            break;
          }
        }

        if (inserted) {
          currentPrev = result[result.length - 1].subjectId;
          continue;
        } else {
          result.push(block);
          currentPrev = chosenSubjectId;
          continue;
        }
      }
    }

    if (!chosenSubjectId) break;

    const blockList = blocksBySubject.get(chosenSubjectId);
    if (blockList && blockList.length > 0) {
      const block = blockList.shift()!;
      result.push(block);
      currentPrev = block.subjectId;
    }
  }

  return result;
}

/**
 * Cria esboços de blocos para uma matéria específica com distribuição de tópicos.
 */
function createSubjectBlockDrafts(
  subject: SubjectInput,
  color: string,
  count: number,
  totalMinutes: number,
  startTopicIdx: number = 0,
): BlockDraft[] {
  const drafts: BlockDraft[] = [];
  const blockDuration = Math.max(30, Math.round(totalMinutes / Math.max(1, count)));
  const allTopics = [...(subject.topics || [])].sort((a, b) => {
    const perfA = typeof a.performance === "number" ? a.performance : 50;
    const perfB = typeof b.performance === "number" ? b.performance : 50;
    return perfA - perfB;
  });

  for (let b = 0; b < count; b++) {
    let assignedTopics: Topic[] = [];
    if (allTopics.length > 0) {
      const idx = (startTopicIdx + b * 2) % allTopics.length;
      assignedTopics = allTopics.slice(idx, idx + 2);
    }

    drafts.push({
      subjectId: subject.id,
      subjectName: subject.name,
      color,
      durationMinutes: blockDuration,
      assignedTopics,
    });
  }

  return drafts;
}

/**
 * MÓDULO 2: Ciclo de Estudos (Sincronizado com Priorização e Calibragem Adaptativa)
 */
export function buildStudyCycleBlocks(
  subjects: SubjectInput[],
  weeklyGoalHours: number,
  currentIndex: number = 0,
  palette: string[],
  existingBlocks?: CycleBlock[],
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

  // 1. Mapeia métricas de urgência SM-2, déficit e cor resolvida
  const subjectsWithMetrics = subjects.map((subject, idx) => {
    const deficit = calculateSubjectDeficit(subject);
    const urgencyScore = getSM2UrgencyScore(subject, now);
    const subjectColor =
      subject.color && subject.color.startsWith("#") && subject.color.length >= 4
        ? subject.color
        : palette[idx % palette.length];

    return {
      ...subject,
      deficit,
      urgencyScore,
      resolvedColor: subjectColor,
    };
  });

  // Ordena por urgência ponderada pelo déficit
  const sortedSubjects = [...subjectsWithMetrics].sort((a, b) => {
    const scoreA = a.urgencyScore * (1 + a.deficit * 0.5);
    const scoreB = b.urgencyScore * (1 + b.deficit * 0.5);
    return scoreB - scoreA;
  });

  const totalWeeklyMinutes = Math.max(1, weeklyGoalHours * 60);

  // 2. Cálculo dos minutos alocados por matéria
  // Verifica se as prioridades já contêm minutos semanais (vindos do autoRebalanceFromPerformanceAction)
  const isAlreadyWeeklyMinutes = sortedSubjects.every((s) => (s.priority || 0) >= 15);
  const subjectAllocatedMinutesMap = new Map<string, number>();

  if (isAlreadyWeeklyMinutes) {
    const totalPriority = sortedSubjects.reduce(
      (acc, s) => acc + (s.priority || 1),
      0,
    );
    sortedSubjects.forEach((s) => {
      let mins = Math.round(
        (totalWeeklyMinutes * (s.priority || 1)) / Math.max(1, totalPriority),
      );
      if (typeof s.allocatedMinutes === "number" && s.allocatedMinutes > 0) {
        mins = Math.round(s.allocatedMinutes);
      }
      subjectAllocatedMinutesMap.set(s.id, Math.max(30, mins));
    });
  } else {
    const totalWeightedPriority = sortedSubjects.reduce(
      (acc, s) => acc + (s.priority || 1) * (1 + s.deficit * 0.5),
      0,
    );
    sortedSubjects.forEach((s) => {
      let mins = Math.round(
        (totalWeeklyMinutes * (s.priority || 1) * (1 + s.deficit * 0.5)) /
          Math.max(1, totalWeightedPriority),
      );
      if (typeof s.allocatedMinutes === "number" && s.allocatedMinutes > 0) {
        mins = Math.round(s.allocatedMinutes);
      }
      subjectAllocatedMinutesMap.set(s.id, Math.max(30, mins));
    });
  }

  // Monta subjectBreakdown compatível com o CycleView
  const sumAllocated = Array.from(subjectAllocatedMinutesMap.values()).reduce(
    (a, b) => a + b,
    0,
  );

  const subjectBreakdown: {
    id: string;
    name: string;
    color: string;
    allocatedMinutes: number;
    percentage: number;
    subjectId?: string;
  }[] = sortedSubjects.map((s) => {
    const allocatedMinutes = subjectAllocatedMinutesMap.get(s.id) || 60;
    const percentage = Math.round(
      (allocatedMinutes / Math.max(1, sumAllocated)) * 100,
    );

    return {
      id: s.id,
      name: s.name,
      color: s.resolvedColor,
      allocatedMinutes,
      percentage,
      subjectId: s.id,
    };
  });

  // 3. Define quantidade alvo de blocos por matéria
  const BLOCK_SIZE_MINUTES = 90;
  const targetBlocksPerSubject = new Map<string, number>();

  sortedSubjects.forEach((s) => {
    const allocated = subjectAllocatedMinutesMap.get(s.id) || 60;
    let numBlocks = Math.max(1, Math.round(allocated / BLOCK_SIZE_MINUTES));

    // Se matéria estiver em déficit crítico (>= 0.35) e tiver carga suficiente, garante reforço proporcional
    if (s.deficit >= 0.35 && allocated >= 90 && numBlocks < Math.round(allocated / 60)) {
      numBlocks = Math.max(numBlocks, Math.round(allocated / 60));
    }

    targetBlocksPerSubject.set(s.id, numBlocks);
  });

  const completedCount = Math.max(0, currentIndex);

  // 4. Se o usuário já estiver com ciclo em andamento (completedBlocks > 0)
  if (completedCount > 0) {
    let completedBlocks: CycleBlock[] = [];

    if (existingBlocks && existingBlocks.length >= completedCount) {
      completedBlocks = existingBlocks.slice(0, completedCount).map((b, i) => ({
        ...b,
        blockNumber: i + 1,
        status: "COMPLETED" as const,
      }));
    } else {
      // Reconstrói a base determinística para obter os blocos concluídos
      const baseDraftsMap = new Map<string, BlockDraft[]>();
      sortedSubjects.forEach((s) => {
        const count = targetBlocksPerSubject.get(s.id) || 1;
        const minutes = subjectAllocatedMinutesMap.get(s.id) || 60;
        baseDraftsMap.set(
          s.id,
          createSubjectBlockDrafts(s, s.resolvedColor, count, minutes, 0),
        );
      });
      const baseInterleaved = interleaveBlocks(baseDraftsMap, null);
      completedBlocks = baseInterleaved.slice(0, completedCount).map((b, i) => ({
        ...b,
        blockNumber: i + 1,
        status: "COMPLETED" as const,
      }));
    }

    const lastCompletedBlock = completedBlocks[completedBlocks.length - 1];
    const prevSubjectId = lastCompletedBlock ? lastCompletedBlock.subjectId : null;

    // Contabiliza o que já foi concluído
    const completedCountsBySub = new Map<string, number>();
    const completedMinutesBySub = new Map<string, number>();
    completedBlocks.forEach((b) => {
      completedCountsBySub.set(
        b.subjectId,
        (completedCountsBySub.get(b.subjectId) || 0) + 1,
      );
      completedMinutesBySub.set(
        b.subjectId,
        (completedMinutesBySub.get(b.subjectId) || 0) + b.durationMinutes,
      );
    });

    // Calcula os blocos restantes para a volta atual
    const remainingDraftsMap = new Map<string, BlockDraft[]>();
    sortedSubjects.forEach((s) => {
      const targetCount = targetBlocksPerSubject.get(s.id) || 1;
      const doneCount = completedCountsBySub.get(s.id) || 0;
      const remainingCount = Math.max(0, targetCount - doneCount);

      const targetMinutes = subjectAllocatedMinutesMap.get(s.id) || 60;
      const doneMinutes = completedMinutesBySub.get(s.id) || 0;
      const remainingMinutes = Math.max(
        30 * remainingCount,
        targetMinutes - doneMinutes,
      );

      if (remainingCount > 0) {
        const drafts = createSubjectBlockDrafts(
          s,
          s.resolvedColor,
          remainingCount,
          remainingMinutes,
          doneCount * 2,
        );
        remainingDraftsMap.set(s.id, drafts);
      }
    });

    const totalRemaining = Array.from(remainingDraftsMap.values()).reduce(
      (sum, list) => sum + list.length,
      0,
    );

    let finalRemainingBlocks: CycleBlock[] = [];

    if (totalRemaining > 0) {
      // Intercala os blocos restantes assegurando que o primeiro != prevSubjectId
      const interleavedRemaining = interleaveBlocks(
        remainingDraftsMap,
        prevSubjectId,
      );

      finalRemainingBlocks = interleavedRemaining.map((draft, idx) => ({
        ...draft,
        blockNumber: completedCount + idx + 1,
        status: idx === 0 ? ("CURRENT" as const) : ("PENDING" as const),
      }));
    }

    const allBlocks = [...completedBlocks, ...finalRemainingBlocks];
    const totalMinutes = allBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const completedBlocksCount = completedBlocks.length;
    const currentProgress = allBlocks.length
      ? Math.round((completedBlocksCount / allBlocks.length) * 100)
      : 0;

    return {
      blocks: allBlocks,
      totalBlocks: allBlocks.length,
      totalMinutes,
      completedBlocks: completedBlocksCount,
      currentProgress,
      subjectBreakdown,
    };
  }

  // 5. Caso inicial: currentIndex === 0
  const draftsMap = new Map<string, BlockDraft[]>();
  sortedSubjects.forEach((s) => {
    const count = targetBlocksPerSubject.get(s.id) || 1;
    const minutes = subjectAllocatedMinutesMap.get(s.id) || 60;
    draftsMap.set(
      s.id,
      createSubjectBlockDrafts(s, s.resolvedColor, count, minutes, 0),
    );
  });

  const interleaved = interleaveBlocks(draftsMap, null);
  const blocks: CycleBlock[] = interleaved.map((draft, idx) => ({
    ...draft,
    blockNumber: idx + 1,
    status: idx === 0 ? ("CURRENT" as const) : ("PENDING" as const),
  }));

  const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const completedBlocksCount = blocks.filter((b) => b.status === "COMPLETED").length;
  const currentProgress = blocks.length
    ? Math.round((completedBlocksCount / blocks.length) * 100)
    : 0;

  return {
    blocks,
    totalBlocks: blocks.length,
    totalMinutes,
    completedBlocks: completedBlocksCount,
    currentProgress,
    subjectBreakdown,
  };
}
