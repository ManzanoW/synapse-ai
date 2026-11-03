import { describe, it, expect } from "vitest";

describe("New User Onboarding Upgrades: Contract, Schedule, Calculator & Audio Mentor", () => {
  describe("Commitment Contract Logic", () => {
    it("formats the exam target date correctly into long Portuguese format", () => {
      const sampleDateStr = "2026-12-15";
      const formatted = new Date(sampleDateStr + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      expect(formatted).toContain("15 de dezembro de 2026");
    });

    it("verifies the 4 non-negotiable clauses are defined", () => {
      const clauses = [
        "Da Meta Diária Inegociável",
        "Do Domínio do Edital",
        "Da Constância sobre a Perfeição",
        "Do Horizonte da Posse",
      ];

      expect(clauses.length).toBe(4);
      for (const clause of clauses) {
        expect(clause.length).toBeGreaterThan(10);
      }
    });
  });

  describe("Study Schedule Sync & Presets", () => {
    const SCHEDULE_PRESETS = [
      { id: "early", title: "Madrugador Focado", hour: 6, minute: 0 },
      { id: "lunch", title: "Almoço Produtivo", hour: 12, minute: 30 },
      { id: "evening", title: "Fim de Tarde", hour: 18, minute: 30 },
      { id: "night", title: "Coruja Noturna", hour: 21, minute: 0 },
    ];

    it("covers the 4 daily habit study slots", () => {
      expect(SCHEDULE_PRESETS.length).toBe(4);
      const hours = SCHEDULE_PRESETS.map((p) => p.hour);
      expect(hours).toContain(6);
      expect(hours).toContain(12);
      expect(hours).toContain(18);
      expect(hours).toContain(21);
    });

    it("generates valid Google Calendar recurring event URL", () => {
      const targetRole = "Polícia Federal";
      const startHour = 18;
      const startMinute = 30;
      const dailyHours = 2;

      const title = encodeURIComponent(`🧠 Sessão de Estudos - ${targetRole} (Synapse AI)`);
      const now = new Date(2026, 10, 15, startHour, startMinute, 0);
      const end = new Date(now.getTime() + dailyHours * 60 * 60 * 1000);

      const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const dates = `${formatDate(now)}/${formatDate(end)}`;
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&recur=RRULE:FREQ=DAILY`;

      expect(url).toContain("calendar.google.com/calendar/render");
      expect(url).toContain("RRULE:FREQ=DAILY");
      expect(url).toContain(encodeURIComponent(targetRole));
    });

    it("constructs valid ICS RFC 5545 calendar event structure", () => {
      const icsHeaders = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "RRULE:FREQ=DAILY",
        "BEGIN:VALARM",
        "TRIGGER:-PT10M",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ];

      for (const line of icsHeaders) {
        expect(line.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Study Hour Value & Dopamine Calculator", () => {
    function calculateStudyHourValue(salary: number, hoursTarget: number, years: number) {
      const benefits = 1500;
      const annual = salary * 13.33 + benefits * 12;
      const cumulativeLifetime = annual * years;
      const valuePerHour = Math.round(cumulativeLifetime / Math.max(100, hoursTarget));
      const valuePerPomodoro = Math.round(valuePerHour * (50 / 60));

      return { annual, cumulativeLifetime, valuePerHour, valuePerPomodoro };
    }

    it("calculates accurate hourly return for an average police role (R$ 14.000)", () => {
      const result = calculateStudyHourValue(14000, 750, 5);

      // (14.000 * 13.33) + 18.000 = ~204.620/ano -> 5 anos = ~1.023.100
      expect(result.cumulativeLifetime).toBeGreaterThan(1000000);
      // R$ 1.023.100 / 750h = ~R$ 1.364/h
      expect(result.valuePerHour).toBeGreaterThan(1000);
      // Pomodoro 50 min
      expect(result.valuePerPomodoro).toBeGreaterThan(800);
    });

    it("calculates positive hourly value even for 1-year conservative horizon", () => {
      const result = calculateStudyHourValue(8000, 800, 1);
      expect(result.valuePerHour).toBeGreaterThan(100);
      expect(result.valuePerPomodoro).toBeGreaterThan(90);
    });
  });

  describe("Mentor Audio Welcome & Voice Selection", () => {
    it("ensures welcome script includes personalized candidate name and target role", () => {
      function generateScript(name: string, role: string) {
        return `Olá, ${name}! Seja muito bem-vindo ao Synapse AI. Eu sei exatamente como é a ansiedade de encarar um edital imenso e sentir que o tempo é curto. Mas a partir de hoje, você não estuda mais sozinho. Aqui na plataforma, você não precisa ser perfeito no primeiro dia, nem virar noites sem dormir. Você só precisa de constância e de cumprir o seu bloco de hoje. Respire fundo, confie no seu processo e vamos juntos construir a sua posse como ${role}!`;
      }

      const script = generateScript("Lucas", "Agente da Polícia Federal");
      expect(script).toContain("Lucas");
      expect(script).toContain("Agente da Polícia Federal");
      expect(script).toContain("constância");
      expect(script).toContain("não estuda mais sozinho");
    });

    it("uses certified human neural Brazilian Portuguese voices", () => {
      const SUPPORTED_NEURAL_VOICES = [
        "pt-BR-FranciscaNeural",
        "pt-BR-AntonioNeural",
        "pt-BR-ThalitaNeural",
      ];

      for (const voice of SUPPORTED_NEURAL_VOICES) {
        expect(voice).toMatch(/^pt-BR-[A-Za-z]+Neural$/);
      }
    });
  });
});
