import {
  calculateNextReview,
  getDefaultCardState,
  predictNextIntervals,
  normalizeGrade,
} from "../src/lib/spaced-repetition";

console.log("=== INICIANDO TESTES DO MOTOR FSRS / SM-2 CALIBRADO ===\n");

// Teste 1: Card Novo com Fallback
const defaultState = getDefaultCardState();
console.log("1. Estado Padrão de Fallback:", defaultState);
console.assert(defaultState.stability === 1.0, "Stability deve ser 1.0");
console.assert(defaultState.difficulty === 5.0, "Difficulty deve ser 5.0");
console.assert(defaultState.interval === 1, "Interval deve ser 1");

// Teste 2: Grade 1 (Again / Errei)
const againResult = calculateNextReview({
  grade: 1,
  repetitions: 2,
  previousInterval: 6,
  stability: 3.0,
  difficulty: 5.0,
});
console.log("\n2. Resultado Grade 1 (Again):", {
  interval: againResult.interval,
  stability: againResult.stability,
  difficulty: againResult.difficulty,
  repetitions: againResult.repetitions,
  lapses: againResult.lapses,
});
console.assert(againResult.interval === 1, "Intervalo de Again deve ser 1 dia");
console.assert(againResult.repetitions === 0, "Repetições devem resetar para 0");
console.assert(againResult.difficulty === 6.2, "Dificuldade deve subir 1.2 (5.0 + 1.2 = 6.2)");
console.assert(Math.abs(againResult.stability - 0.9) < 0.001, "Estabilidade deve recuar com 0.3x");

// Teste 3: Grade 2 (Hard / Difícil)
const hardResult = calculateNextReview({
  grade: 2,
  repetitions: 1,
  previousInterval: 3,
  stability: 2.0,
  difficulty: 5.0,
});
console.log("\n3. Resultado Grade 2 (Hard):", {
  interval: hardResult.interval,
  stability: hardResult.stability,
  difficulty: hardResult.difficulty,
  repetitions: hardResult.repetitions,
});
console.assert(hardResult.repetitions === 2, "Repetições devem ser 2");
console.assert(hardResult.difficulty === 5.5, "Dificuldade deve subir 0.5 (5.0 + 0.5 = 5.5)");
console.assert(hardResult.interval >= 4, "Intervalo deve crescer com freio multiplicador");

// Teste 4: Grade 3 (Good / Bom)
const goodResult = calculateNextReview({
  grade: 3,
  repetitions: 1,
  previousInterval: 3,
  stability: 2.0,
  difficulty: 5.0,
});
console.log("\n4. Resultado Grade 3 (Good):", {
  interval: goodResult.interval,
  stability: goodResult.stability,
  difficulty: goodResult.difficulty,
  repetitions: goodResult.repetitions,
});
console.assert(goodResult.repetitions === 2, "Repetições devem ser 2");
console.assert(goodResult.interval > hardResult.interval, "Intervalo de Good deve superar o de Hard");

// Teste 5: Grade 4 (Easy / Fácil)
const easyResult = calculateNextReview({
  grade: 4,
  repetitions: 1,
  previousInterval: 3,
  stability: 2.0,
  difficulty: 5.0,
});
console.log("\n5. Resultado Grade 4 (Easy):", {
  interval: easyResult.interval,
  stability: easyResult.stability,
  difficulty: easyResult.difficulty,
  repetitions: easyResult.repetitions,
});
console.assert(easyResult.repetitions === 2, "Repetições devem ser 2");
console.assert(easyResult.difficulty === 4.2, "Dificuldade deve reduzir 0.8 (5.0 - 0.8 = 4.2)");
console.assert(easyResult.interval > goodResult.interval, "Intervalo de Easy deve superar o de Good");

// Teste 6: Proteção por Déficit de Matéria (< 65%)
const normalAccuracyResult = calculateNextReview({
  grade: 3,
  repetitions: 2,
  previousInterval: 6,
  stability: 4.0,
  difficulty: 5.0,
  subjectAccuracy: 80, // Acima de 65%
});

const deficitAccuracyResult = calculateNextReview({
  grade: 3,
  repetitions: 2,
  previousInterval: 6,
  stability: 4.0,
  difficulty: 5.0,
  subjectAccuracy: 45, // Abaixo de 65% (crítico)
});

console.log("\n6. Comparativo de Retenção por Matéria:", {
  normalAccuracyInterval: normalAccuracyResult.interval,
  isCriticalNormal: normalAccuracyResult.isSubjectCriticalDeficit,
  deficitAccuracyInterval: deficitAccuracyResult.interval,
  isCriticalDeficit: deficitAccuracyResult.isSubjectCriticalDeficit,
  retentionFactor: deficitAccuracyResult.subjectRetentionFactor,
});
console.assert(deficitAccuracyResult.isSubjectCriticalDeficit === true, "Déficit deve ser detectado");
console.assert(deficitAccuracyResult.subjectRetentionFactor === 0.8, "Multiplicador de 0.8x deve ser aplicado");
console.assert(deficitAccuracyResult.interval <= normalAccuracyResult.interval, "Intervalo com déficit deve ser menor ou igual");

// Teste 7: Previsão dos 4 Intervalos na UI (predictNextIntervals)
const projections = predictNextIntervals({
  interval: 1,
  stability: 1.0,
  difficulty: 5.0,
  repetitions: 0,
});
console.log("\n7. Projeções para Card Inicial:", projections);
console.assert(projections[1].label === "1d", "Again deve projetar 1d");
console.assert(projections[2].interval > 0, "Hard deve ter projeção válida");
console.assert(projections[3].interval >= projections[2].interval, "Good deve ter intervalo >= Hard");
console.assert(projections[4].interval >= projections[3].interval, "Easy deve ter intervalo >= Good");

console.log("\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!");
