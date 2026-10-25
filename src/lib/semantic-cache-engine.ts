// src/lib/semantic-cache-engine.ts
// Motor Centralizado de Normalização Canônica, Similaridade Semântica (Jaccard + Containment)
// e Escalonamento por Nível de Dificuldade (EASY | MEDIUM | HARD) para:
// 1. Trilhas & Teorias 2.0
// 2. Simulados & Questões Inéditas
// 3. Flashcards FSRS
// 4. Editais Verticalizados por Cargo/Carreira

export type DifficultyTier = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

const STOPWORDS_PT = new Set([
  "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "para", "por",
  "com", "sem", "sob", "sobre", "entre", "ate", "a", "o", "as", "os", "e", "ou",
  "um", "uma", "uns", "umas", "nocoes", "nocao", "conceito", "conceitos", "basicos",
  "basico", "introducao", "estudo", "geral", "gerais", "aspectos", "aplicada",
  "aplicado", "aula", "topico", "modulo", "parte", "capitulo", "item", "lei", "n",
]);

export const CANONICAL_TAXONOMY_CLUSTERS: { clusterId: string; keywords: string[] }[] = [
  {
    clusterId: "cluster::lgpd-lei-13709-seguranca",
    keywords: ["lgpd", "13709", "protecao", "dados", "pessoais", "anpd", "sensivel", "anonimizacao"],
  },
  {
    clusterId: "cluster::lei-organica-competencias-municipais",
    keywords: ["organica", "municipal", "municipio", "competencia", "camara", "prefeito", "vereador", "artigo 29", "simetria"],
  },
  {
    clusterId: "cluster::banco-dados-formas-normais-sql",
    keywords: ["banco", "dados", "sql", "relacional", "normalizacao", "1fn", "2fn", "3fn", "bcnf", "join", "ddl", "dml"],
  },
  {
    clusterId: "cluster::portugues-sintaxe-crase-regencia",
    keywords: ["portugues", "crase", "regencia", "concordancia", "pontuacao", "reescrita", "sintaxe", "oracao", "conjuncao"],
  },
  {
    clusterId: "cluster::adm-licitacoes-contratos-14133",
    keywords: ["licitacao", "licitacoes", "14133", "pregao", "concorrencia", "dispensa", "inexigibilidade", "contrato"],
  },
  {
    clusterId: "cluster::adm-atos-poderes-administrativos",
    keywords: ["ato", "atos", "administrativo", "administrativos", "atributo", "anulacao", "revogacao", "poderes", "vinculado", "discricionario"],
  },
  {
    clusterId: "cluster::adm-improbidade-8429-agentes-8112",
    keywords: ["improbidade", "8429", "8112", "servidor", "estatuto", "disciplinar", "pad", "penalidade", "provimento", "vacancia"],
  },
  {
    clusterId: "cluster::const-direitos-garantias-art5",
    keywords: ["constitucional", "direitos", "garantias", "fundamentais", "habeas", "mandado", "seguranca", "inviolabilidade"],
  },
  {
    clusterId: "cluster::ti-engenharia-software-agil",
    keywords: ["engenharia", "software", "scrum", "kanban", "agil", "requisitos", "uml", "arquitetura", "devops", "git"],
  },
  {
    clusterId: "cluster::ti-redes-criptografia-seguranca",
    keywords: ["redes", "tcp", "osi", "firewall", "criptografia", "assinatura", "certificado", "27001", "27002", "owasp"],
  },
  {
    clusterId: "cluster::rlm-logica-proposicional-tabelas",
    keywords: ["raciocinio", "logico", "proposicao", "tabela", "verdade", "equivalencia", "negacao", "tautologia", "quantificador"],
  },
];

/**
 * Padroniza qualquer string de dificuldade do sistema ("Iniciante", "BEGINNER", "Fácil",
 * "Intermediário", "Médio", "Avançado", "Difícil", "Hardcore", etc.) em 3 tiers canônicos:
 * - EASY (Base / Essencial)
 * - MEDIUM (Nível Prova Padrão)
 * - HARD (Avançado / Pegadinhas Pesadas / Jurisprudência)
 */
export function normalizeDifficultyTier(rawDifficulty?: string | null): DifficultyTier {
  if (!rawDifficulty) return "MEDIUM";
  const norm = rawDifficulty
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (
    norm.includes("extrema") ||
    norm.includes("extreme") ||
    norm.includes("elite") ||
    norm.includes("perito")
  ) {
    return "EXTREME";
  }

  if (
    norm.includes("facil") ||
    norm.includes("easy") ||
    norm.includes("beginner") ||
    norm.includes("iniciante") ||
    norm.includes("basico") ||
    norm.includes("essencial")
  ) {
    return "EASY";
  }

  if (
    norm.includes("dificil") ||
    norm.includes("hard") ||
    norm.includes("advanced") ||
    norm.includes("avancado") ||
    norm.includes("hardcore") ||
    norm.includes("pesad") ||
    norm.includes("especialista")
  ) {
    return "HARD";
  }

  return "MEDIUM";
}

/**
 * Extrai a identidade semântica e canônica de qualquer combinação Matéria + Tópico (+ Dificuldade opcional)
 */
export function computeCanonicalIdentity(
  subjectName: string,
  topicTitle: string,
  difficulty?: string | null,
): {
  canonicalKey: string;
  difficultyTier: DifficultyTier;
  scopedKey: string;
  semanticTokens: string[];
} {
  const difficultyTier = normalizeDifficultyTier(difficulty);

  const raw = `${subjectName || ""} ${topicTitle || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)\.(\d{3})/g, "$1$2") // une números de leis ("13.709" -> "13709", "14.133" -> "14133")
    .replace(/\b(\d+(\.\d+)*|[ivxlcdm]+)\s*[-.)]\s*/gi, " ") // remove numeração de edital ("1.2 -", "II.")
    .replace(/[^a-z0-9\s]/g, " ");

  const rawTokens = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS_PT.has(t));

  const stemmedTokens = Array.from(
    new Set(
      rawTokens.map((tok) => {
        if (tok.endsWith("coes") && tok.length > 5) return tok.slice(0, -4) + "cao";
        if (tok.endsWith("ais") && tok.length > 5) return tok.slice(0, -3) + "al";
        if (tok.endsWith("s") && tok.length > 4 && !tok.endsWith("ss")) return tok.slice(0, -1);
        return tok;
      }),
    ),
  ).sort();

  let bestCluster = "";
  let bestClusterHits = 0;

  for (const cluster of CANONICAL_TAXONOMY_CLUSTERS) {
    let hits = 0;
    for (const kw of cluster.keywords) {
      if (raw.includes(kw) || stemmedTokens.includes(kw)) {
        hits++;
      }
    }
    if (hits > bestClusterHits) {
      bestClusterHits = hits;
      bestCluster = cluster.clusterId;
    }
  }

  const canonicalKey =
    bestClusterHits >= 2
      ? bestCluster
      : `custom::${stemmedTokens.slice(0, 5).join("-") || "topico-geral"}`;

  return {
    canonicalKey,
    difficultyTier,
    scopedKey: `${canonicalKey}::${difficultyTier}`,
    semanticTokens: stemmedTokens,
  };
}

/**
 * Calcula a similaridade semântica entre duas listas de tokens (combinando Jaccard + Containment)
 */
export function computeSemanticSimilarity(tokensA: string[], tokensB: string[]): number {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  const containment =
    Math.min(setA.size, setB.size) > 0
      ? intersection / Math.min(setA.size, setB.size)
      : 0;
  return Math.max(jaccard, containment * 0.85);
}

/**
 * Verifica se dois tópicos/disciplinas de usuários diferentes são semanticamente equivalentes
 * (mesmo cluster canônico OU similaridade de tokens >= threshold)
 */
export function areTopicsSemanticallyEquivalent(
  subjectA: string,
  topicA: string,
  subjectB: string,
  topicB: string,
  threshold = 0.55,
): { isMatch: boolean; score: number; canonicalKey: string } {
  const idA = computeCanonicalIdentity(subjectA, topicA);
  const idB = computeCanonicalIdentity(subjectB, topicB);

  if (idA.canonicalKey.startsWith("cluster::") && idA.canonicalKey === idB.canonicalKey) {
    return { isMatch: true, score: 0.95, canonicalKey: idA.canonicalKey };
  }

  const sim = computeSemanticSimilarity(idA.semanticTokens, idB.semanticTokens);
  return {
    isMatch: sim >= threshold,
    score: sim,
    canonicalKey: idA.canonicalKey,
  };
}
