import { describe, it, expect } from "vitest";
import {
  buildWeeklySchedule,
  buildStudyCycleBlocks,
  calculateSubjectDeficit,
  SubjectInput,
} from "@/lib/study-cycle";

describe("Study Schedule & Cycle Engine (Cronograma Semanal)", () => {
  const sampleSubjects: SubjectInput[] = [
    {
      id: "sub-1",
      name: "Direito Constitucional",
      priority: 3,
      color: "#3b82f6",
      topics: [
        { id: "top-1", title: "Direitos Fundamentais", performance: 80 },
        { id: "top-2", title: "Organização do Estado", performance: 60 },
      ],
    },
    {
      id: "sub-2",
      name: "Direito Administrativo",
      priority: 2,
      color: "#10b981",
      topics: [
        { id: "top-3", title: "Atos Administrativos", performance: 50 },
        { id: "top-4", title: "Licitações (Lei 14.133)", performance: 40 },
      ],
    },
    {
      id: "sub-3",
      name: "Língua Portuguesa",
      priority: 2,
      color: "#f59e0b",
      topics: [
        { id: "top-5", title: "Crase e Pontuação", performance: 90 },
      ],
    },
    {
      id: "sub-4",
      name: "Raciocínio Lógico",
      priority: 1,
      color: "#ef4444",
      topics: [
        { id: "top-6", title: "Tabela Verdade", performance: 75 },
      ],
    },
    {
      id: "sub-5",
      name: "Informática",
      priority: 1,
      color: "#8b5cf6",
      topics: [
        { id: "top-7", title: "Segurança da Informação", performance: 65 },
      ],
    },
  ];

  describe("buildWeeklySchedule", () => {
    it("deve distribuir 5 disciplinas pelos 5 dias úteis sem deixar nenhum dia vazio", () => {
      const { scheduleByDay, subjectOverview } = buildWeeklySchedule(
        sampleSubjects,
        15, // 15 horas semanais
        5   // 5 dias (Seg a Sex)
      );

      expect(scheduleByDay).toHaveLength(5);
      expect(subjectOverview).toHaveLength(5);

      // Cada dia de 0 a 4 deve ter pelo menos 1 disciplina alocada
      scheduleByDay.forEach((day, idx) => {
        expect(day.dayIndex).toBe(idx);
        expect(day.subjects.length).toBeGreaterThanOrEqual(1);
        expect(day.totalMinutes).toBeGreaterThan(0);
      });

      // A soma das porcentagens deve aproximar 100%
      const totalPercentage = subjectOverview.reduce((sum, s) => sum + s.percentageOfTotal, 0);
      expect(totalPercentage).toBeGreaterThanOrEqual(98);
      expect(totalPercentage).toBeLessThanOrEqual(102);
    });

    it("deve alocar ciclicamente quando houver menos disciplinas do que dias ativos", () => {
      const fewSubjects = sampleSubjects.slice(0, 2); // Apenas 2 matérias
      const { scheduleByDay } = buildWeeklySchedule(
        fewSubjects,
        10,
        5 // 5 dias
      );

      expect(scheduleByDay).toHaveLength(5);
      // Todos os 5 dias devem ter matérias alocadas
      scheduleByDay.forEach((day) => {
        expect(day.subjects.length).toBeGreaterThan(0);
      });
    });

    it("deve respeitar a atribuição de dia fixado pelo usuário (assignedDay)", () => {
      const subjectsWithPinnedDay: SubjectInput[] = [
        { ...sampleSubjects[0], assignedDay: 2 }, // Pinned na Quarta-feira (idx 2)
        ...sampleSubjects.slice(1).map((s) => ({ ...s, assignedDay: null })),
      ];

      const { scheduleByDay } = buildWeeklySchedule(
        subjectsWithPinnedDay,
        10,
        5
      );

      const wednesday = scheduleByDay.find((d) => d.dayIndex === 2);
      expect(wednesday).toBeDefined();
      expect(wednesday?.subjects.some((s) => s.id === "sub-1")).toBe(true);
    });

    it("deve tratar graciosamente entradas vazias ou 0 dias ativos", () => {
      const emptyResult = buildWeeklySchedule([], 10, 5);
      expect(emptyResult.scheduleByDay).toEqual([]);
      expect(emptyResult.subjectOverview).toEqual([]);

      const zeroDaysResult = buildWeeklySchedule(sampleSubjects, 10, 0);
      expect(zeroDaysResult.scheduleByDay).toEqual([]);
    });

    it("deve calcular o tempo proporcional baseado na prioridade e na carga semanal", () => {
      const { subjectOverview } = buildWeeklySchedule(
        sampleSubjects,
        18, // 18 horas = 1080 min
        6
      );

      // sub-1 tem prioridade 3; sub-4 tem prioridade 1.
      // sub-1 deve receber ~3x mais minutos alocados que sub-4
      const sub1 = subjectOverview.find((s) => s.id === "sub-1");
      const sub4 = subjectOverview.find((s) => s.id === "sub-4");

      expect(sub1).toBeDefined();
      expect(sub4).toBeDefined();
      expect(sub1!.weeklyMinutesAllocated).toBeGreaterThan(sub4!.weeklyMinutesAllocated * 2);
    });
  });

  describe("calculateSubjectDeficit", () => {
    it("deve identificar matéria com déficit crítico quando o desempenho está abaixo de 70%", () => {
      const criticalSub: SubjectInput = {
        id: "sub-crit",
        name: "Contabilidade",
        accuracyPercentage: 45, // < 70%
      };

      const deficit = calculateSubjectDeficit(criticalSub);
      expect(deficit).toBeGreaterThan(0);
    });

    it("deve retornar 0 de déficit quando o desempenho é satisfatório", () => {
      const strongSub: SubjectInput = {
        id: "sub-strong",
        name: "Português",
        accuracyPercentage: 90,
      };

      const deficit = calculateSubjectDeficit(strongSub);
      expect(deficit).toBe(0);
    });
  });

  describe("buildStudyCycleBlocks", () => {
    it("deve construir blocos contínuos de estudo com durações balanceadas", () => {
      const cycle = buildStudyCycleBlocks(
        sampleSubjects,
        15,
        0,
        ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
      );

      expect(cycle.blocks.length).toBeGreaterThan(0);
      expect(cycle.totalMinutes).toBeGreaterThan(0);
      expect(cycle.blocks[0].status).toBe("CURRENT");

      // Cada bloco deve ter pelo menos 15 minutos e matérias reconhecidas
      cycle.blocks.forEach((block) => {
        expect(block.durationMinutes).toBeGreaterThanOrEqual(15);
        expect(block.subjectName).toBeTruthy();
      });
    });
  });
});
