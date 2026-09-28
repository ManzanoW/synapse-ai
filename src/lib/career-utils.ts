/**
 * Utilitário para detecção inteligente de carreiras jurídicas e de direito
 */

const LAW_KEYWORDS = [
  "direito",
  "jurídic",
  "juridic",
  "jurid",
  "delegad",
  "magistratura",
  "juiz",
  "juíza",
  "promotor",
  "procurador",
  "procuradoria",
  "defensor",
  "defensoria",
  "advoga",
  "oab",
  "tribuna",
  "cartório",
  "cartorio",
];

/**
 * Retorna true se o foco de carreira ou cargo do usuário pertencer à área do Direito
 */
export function isLawFocused(
  careerFocus?: string | null,
  targetRole?: string | null,
): boolean {
  if (!careerFocus && !targetRole) return false;

  const combined = `${careerFocus || ""} ${targetRole || ""}`.toLowerCase();

  return LAW_KEYWORDS.some((kw) => combined.includes(kw));
}

/**
 * Adiciona a flag de módulo jurídico ao targetRole caso ainda não esteja presente
 */
export function enableLawModuleInTargetRole(currentRole?: string | null): string {
  const role = (currentRole || "").trim();
  if (isLawFocused(role)) return role;
  return role ? `${role} (+ Módulo Jurídico)` : "Concurso Geral (+ Módulo Jurídico)";
}

/**
 * Remove termos jurídicos ao desativar o módulo de direito
 */
export function disableLawModule(
  currentCareer?: string | null,
  currentTargetRole?: string | null,
): { careerFocus: string; targetRole: string } {
  let role = (currentTargetRole || "")
    .replace(/\(\+\s*Módulo Jurídico\)/gi, "")
    .replace(/\+?\s*Módulo Jurídico/gi, "")
    .replace(/\+?\s*Direito/gi, "")
    .trim();

  let career = (currentCareer || "").trim();

  // Se a carreira selecionada era especificamente do Direito, migra para Concurso Geral
  if (isLawFocused(career)) {
    career = "Concurso Público Geral";
    if (isLawFocused(role)) {
      role = "Concurso Geral";
    }
  }

  return {
    careerFocus: career || "Concurso Público Geral",
    targetRole: role || "Concurso Geral",
  };
}
