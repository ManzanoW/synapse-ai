import { describe, it, expect } from "vitest";
import { calculateLevelData, getRequiredXpForLevel } from "@/lib/gamification/levels";

describe("Gamification & Level System", () => {
  it("deve iniciar no Nível 1 com 0 XP", () => {
    const levelData = calculateLevelData(0, 0);
    expect(levelData.level).toBe(1);
    expect(levelData.prestige).toBe(0);
    expect(levelData.progressPercentage).toBe(0);
    expect(levelData.title).toBe("Neófito dos Estudos");
  });

  it("deve calcular o avanço de nível conforme o XP acumulado aumenta", () => {
    const xpLevel5 = getRequiredXpForLevel(5);
    const levelData = calculateLevelData(xpLevel5 + 50, 0);

    expect(levelData.level).toBe(5);
    expect(levelData.title).toBe("Praticante de Flashcards");
    expect(levelData.progressPercentage).toBeGreaterThan(0);
    expect(levelData.progressPercentage).toBeLessThan(100);
  });

  it("deve limitar o nível ao máximo de 50 no ciclo atual", () => {
    const maxLevelXp = getRequiredXpForLevel(50);
    const levelData = calculateLevelData(maxLevelXp + 50000, 0);

    expect(levelData.level).toBe(50);
    expect(levelData.progressPercentage).toBe(100);
    expect(levelData.title).toBe("Entidade dos Concursos");
  });

  it("deve atribuir o prestígio e o tier visual correto", () => {
    const levelDataP1 = calculateLevelData(500, 1);
    expect(levelDataP1.prestige).toBe(1);
    expect(levelDataP1.prestigeTier.name).toBe("Cromado Sináptico");

    const levelDataP2 = calculateLevelData(500, 2);
    expect(levelDataP2.prestige).toBe(2);
    expect(levelDataP2.prestigeTier.name).toBe("Dourado Astral");
  });
});
