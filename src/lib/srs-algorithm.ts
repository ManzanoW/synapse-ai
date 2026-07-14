// src/lib/srs-algorithm.ts

export const calculateNextReview = (
  performance: "bom" | "dificil" | "errei",
  currentInterval: number,
) => {
  // Se errou, revisa em 1 dia (reset)
  if (performance === "errei") return 1;

  // Se foi difícil, revisa em 3 dias
  if (performance === "dificil") return 3;

  // Se foi bom, multiplica o intervalo atual por 2 (dobra o tempo)
  return currentInterval * 2 || 7;
};
