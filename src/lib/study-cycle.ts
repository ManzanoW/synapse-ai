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
  topics?: Topic[];
}

export interface ScheduledSubject extends SubjectInput {
  weeklyMinutesAllocated: number;
  dailyMinutesAllocated: number;
  percentageOfTotal: number;
  assignedTopics: Topic[]; // Tópicos alocados para aquele dia
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

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * MÓDULO 1: Cronograma Semanal (Baseado em dias úteis Seg-Dom)
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

  // 1. Visão Geral da Carga Horária por Matéria (para o Donut/Legenda)
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

  // 2. Rotação de Matérias (Interleaving: 2 a 3 por dia)
  const maxSubjectsPerDay = Math.min(
    3,
    Math.max(2, Math.ceil(subjects.length / 2)),
  );

  const topicPointers: Record<string, number> = {};
  subjects.forEach((s) => (topicPointers[s.id] = 0));

  let globalSubjectIndex = 0;
  const scheduleByDay: DaySchedule[] = [];

  for (let dayIdx = 0; dayIdx < activeDaysPerWeek; dayIdx++) {
    const dayName = daysOfWeek[dayIdx % daysOfWeek.length];
    const daySubjects: ScheduledSubject[] = [];

    const subjectsForToday: SubjectInput[] = [];
    for (let i = 0; i < maxSubjectsPerDay; i++) {
      const selectedSubject = subjects[globalSubjectIndex % subjects.length];
      subjectsForToday.push(selectedSubject);
      globalSubjectIndex++;
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

      // FILTRO INTELIGENTE: Dá preferência estrita aos tópicos "Pendente"
      const pendingTopics = allTopics.filter(
        (t) => !t.firstStudy || t.firstStudy === "Pendente",
      );
      const reviewTopics = allTopics.filter(
        (t) => t.firstStudy === "Em Revisão",
      );

      // Se não tem pendentes, usa a fila de revisão como fallback
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
 * MÓDULO 2: Ciclo de Estudos (Fila sequencial contínua de blocos #1, #2, #3...)
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
  const BLOCK_SIZE_MINUTES = 90; // Cada bloco padrão tem 1h30m

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
