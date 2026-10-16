// tests/unit/power-user-improvements.test.ts
import { describe, it, expect } from "vitest";

describe("Radar de Pegadinhas - Detecção de Termos Críticos de Concurso", () => {
  const TRAP_WORDS_REGEX =
    /\b(EXCETO|INCORRETO|INCORRETA|INCORRETAS|INCORRETOS|VEDADO|VEDADA|VEDADOS|VEDADAS|DEFESO|DEFESA|PRESCINDE|PRESCINDÍVEL|PRIVATIVAMENTE|EXCLUSIVAMENTE|NUNCA|SEMPRE|SALVO|NÃO\s+PODE|NÃO\s+É|NÃO\s+SERÁ)\b/gi;

  it("detecta termos clássicos de restrição e negação de bancas", () => {
    const text1 = "Assinale a alternativa que apresenta hipótese VEDADA pela Constituição.";
    const matches1 = text1.match(TRAP_WORDS_REGEX);
    expect(matches1).toBeDefined();
    expect(matches1?.[0].toUpperCase()).toBe("VEDADA");

    const text2 = "Todas as assertivas abaixo estão corretas, EXCETO:";
    const matches2 = text2.match(TRAP_WORDS_REGEX);
    expect(matches2).toBeDefined();
    expect(matches2?.[0].toUpperCase()).toBe("EXCETO");

    const text3 = "O ato de nomeação compete PRIVATIVAMENTE ao Governador.";
    const matches3 = text3.match(TRAP_WORDS_REGEX);
    expect(matches3).toBeDefined();
    expect(matches3?.[0].toUpperCase()).toBe("PRIVATIVAMENTE");

    const text4 = "A ação penal pública incondicionada PRESCINDE de representação.";
    const matches4 = text4.match(TRAP_WORDS_REGEX);
    expect(matches4).toBeDefined();
    expect(matches4?.[0].toUpperCase()).toBe("PRESCINDE");
  });

  it("ignora palavras regulares que apenas contêm trechos de letras", () => {
    const regularText = "O defensor público apresentou a petição com clareza.";
    const matches = regularText.match(TRAP_WORDS_REGEX);
    // 'defensor' não deve ser pego por 'DEFESO' devido aos boundaries \b
    expect(matches).toBeNull();
  });
});

describe("Mecânica de Combo Streak nas Questões", () => {
  it("acumula sequência de acertos e zera em caso de erro", () => {
    let combo = 0;
    const updateCombo = (isCorrect: boolean) => {
      if (isCorrect) combo += 1;
      else combo = 0;
      return combo;
    };

    expect(updateCombo(true)).toBe(1);
    expect(updateCombo(true)).toBe(2);
    expect(updateCombo(true)).toBe(3);
    // Erro quebra o combo
    expect(updateCombo(false)).toBe(0);
    // Novo acerto reinicia
    expect(updateCombo(true)).toBe(1);
  });
});

describe("Pomodoro - Formatação do Título Regressivo", () => {
  const formatTabTitle = (minutes: number, seconds: number, mode: "foco" | "curta") => {
    const minStr = String(minutes).padStart(2, "0");
    const secStr = String(seconds).padStart(2, "0");
    const icon = mode === "foco" ? "🍅" : "☕";
    const label = mode === "foco" ? "Foco" : "Pausa";
    return `${icon} ${minStr}:${secStr} (${label}) • Synapse AI`;
  };

  it("formata corretamente o título para exibição na aba do navegador", () => {
    expect(formatTabTitle(25, 0, "foco")).toBe("🍅 25:00 (Foco) • Synapse AI");
    expect(formatTabTitle(4, 9, "foco")).toBe("🍅 04:09 (Foco) • Synapse AI");
    expect(formatTabTitle(0, 45, "foco")).toBe("🍅 00:45 (Foco) • Synapse AI");
    expect(formatTabTitle(5, 0, "curta")).toBe("☕ 05:00 (Pausa) • Synapse AI");
  });
});
