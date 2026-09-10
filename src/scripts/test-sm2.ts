import { buildWeeklySchedule, SubjectInput } from "../lib/study-cycle";

const subjectsMock: SubjectInput[] = [
  {
    id: "1",
    name: "Direito Constitucional",
    priority: 8.0,
    easiness: 2.5,
    nextReview: new Date(), // Em dia
  },
  {
    id: "2",
    name: "Raciocínio Lógico",
    priority: 4.0,
    easiness: 1.4, // Dificuldade alta (Retenção ruim)
    nextReview: new Date(Date.now() - 3 * 86400000), // 3 dias atrasado
  },
];

const schedule = buildWeeklySchedule(subjectsMock, 10, 5);
console.log(
  "Ordem do primeiro dia:",
  schedule.scheduleByDay[0].subjects.map((s) => s.name),
);
