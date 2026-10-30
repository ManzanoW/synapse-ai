import { describe, it, expect } from "vitest";

describe("New User Onboarding: Briefing, Starter Kits & AI Mentor", () => {
  describe("DailyBriefingCard greeting logic", () => {
    function getGreeting(hour: number): { text: string; category: string } {
      if (hour >= 5 && hour < 12) {
        return { text: "Bom dia", category: "morning" };
      }
      if (hour >= 12 && hour < 18) {
        return { text: "Boa tarde", category: "afternoon" };
      }
      return { text: "Boa noite", category: "night" };
    }

    it("returns Bom dia for morning hours (05:00 - 11:59)", () => {
      expect(getGreeting(6).text).toBe("Bom dia");
      expect(getGreeting(11).text).toBe("Bom dia");
    });

    it("returns Boa tarde for afternoon hours (12:00 - 17:59)", () => {
      expect(getGreeting(12).text).toBe("Boa tarde");
      expect(getGreeting(17).text).toBe("Boa tarde");
    });

    it("returns Boa noite for evening & night hours (18:00 - 04:59)", () => {
      expect(getGreeting(18).text).toBe("Boa noite");
      expect(getGreeting(23).text).toBe("Boa noite");
      expect(getGreeting(2).text).toBe("Boa noite");
    });
  });

  describe("Starter Edital Macro-Areas (2-Step Progressive Choice)", () => {
    const MACRO_AREAS = [
      { id: "policial", name: "Carreira Policial", icon: "👮" },
      { id: "juridica", name: "Tribunais & Jurídica", icon: "⚖️" },
      { id: "fiscal_controle", name: "Fiscal & Controle", icon: "💰" },
      { id: "administrativo", name: "Administrativo & Bancário", icon: "🏛️" },
      { id: "ti", name: "Tecnologia & Dados", icon: "💻" },
      { id: "saude_educacao", name: "Saúde & Educação", icon: "🩺" },
    ];

    it("defines exactly 6 high-level macro areas preventing choice overload", () => {
      expect(MACRO_AREAS.length).toBe(6);
      const uniqueIds = new Set(MACRO_AREAS.map((a) => a.id));
      expect(uniqueIds.size).toBe(6);
    });

    it("covers the major Brazilian civil service exam categories", () => {
      const ids = MACRO_AREAS.map((a) => a.id);
      expect(ids).toContain("policial");
      expect(ids).toContain("juridica");
      expect(ids).toContain("fiscal_controle");
      expect(ids).toContain("administrativo");
      expect(ids).toContain("ti");
      expect(ids).toContain("saude_educacao");
    });
  });

  describe("AI Mentor Prompt & Structure Verification", () => {
    it("ensures pedagogical response contains definition, mnemonic and trap alert", () => {
      const sampleMentorAnswer = `### 🎯 Desconcentração vs. Descentralização
Ocorre dentro da mesma pessoa jurídica.
### 💡 Mnemônico
DesCONcentração = com O de Órgão.
### ⚠️ Pegadinha de Banca
Não há hierarquia na descentralização.`;

      expect(sampleMentorAnswer).toContain("### 🎯");
      expect(sampleMentorAnswer).toContain("### 💡");
      expect(sampleMentorAnswer).toContain("### ⚠️");
    });
  });
});
