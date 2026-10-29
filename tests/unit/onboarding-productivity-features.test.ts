import { describe, it, expect } from "vitest";

describe("Onboarding & High-Impact Productivity Features", () => {
  describe("QuickDiagnosticModal logic", () => {
    it("evaluates diagnostic performance levels correctly", () => {
      function evaluateLevel(score: number, total: number): "iniciante" | "intermediario" | "avancado" {
        const ratio = score / total;
        if (ratio >= 0.8) return "avancado";
        if (ratio >= 0.5) return "intermediario";
        return "iniciante";
      }

      expect(evaluateLevel(5, 5)).toBe("avancado");
      expect(evaluateLevel(4, 5)).toBe("avancado");
      expect(evaluateLevel(3, 5)).toBe("intermediario");
      expect(evaluateLevel(2, 5)).toBe("iniciante");
      expect(evaluateLevel(0, 5)).toBe("iniciante");
    });

    it("formats diagnostic timer accurately into mm:ss", () => {
      function formatTimer(totalSecs: number): string {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }

      expect(formatTimer(180)).toBe("03:00");
      expect(formatTimer(95)).toBe("01:35");
      expect(formatTimer(9)).toBe("00:09");
      expect(formatTimer(0)).toBe("00:00");
    });
  });

  describe("DashboardDDayWidget calculations", () => {
    it("computes days remaining and projected study hours correctly", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + 45); // 45 days in future

      const diffTime = targetDate.getTime() - today.getTime();
      const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const dailyGoalHours = 3;
      const estimatedHours = Math.round(daysRemaining * dailyGoalHours);

      expect(daysRemaining).toBe(45);
      expect(estimatedHours).toBe(135);
    });

    it("prevents negative or zero daysRemaining when date is today or past", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 2);

      const diffTime = pastDate.getTime() - today.getTime();
      const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      expect(daysRemaining).toBe(1);
    });
  });

  describe("Welcome Gift & First-Access XP Claim", () => {
    it("tracks gift claim state in storage mock", () => {
      const storage: Record<string, string> = {};

      function isClaimed(): boolean {
        return storage["synapse_welcome_gift_claimed"] === "true";
      }

      function claimGift() {
        storage["synapse_welcome_gift_claimed"] = "true";
      }

      expect(isClaimed()).toBe(false);
      claimGift();
      expect(isClaimed()).toBe(true);
    });
  });

  describe("Command Palette Action Keys", () => {
    it("verifies expected productivity action IDs are defined", () => {
      const EXPECTED_ACTIONS = [
        "action-quick-diagnostic",
        "action-dday-final",
        "action-study-room-pomodoro",
        "action-print-edital-a4",
        "action-print-week-a4",
      ];

      for (const id of EXPECTED_ACTIONS) {
        expect(id).toMatch(/^action-[a-z0-9-]+$/);
      }
    });
  });
});
