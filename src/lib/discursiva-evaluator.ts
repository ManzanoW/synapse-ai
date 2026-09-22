import { generateContentWithFallback } from "@/lib/gemini-fallback";

export interface CriteriaScore {
  name: string;
  maxScore: number;
  awardedScore: number;
  comments: string;
}

export interface LineError {
  line: number;
  excerpt: string;
  errorType: "Gramática" | "Pontuação" | "Crase" | "Concordância" | "Regência" | "Coesão" | "Vocabulário" | "Estrutura";
  explanation: string;
  suggestion: string;
}

export interface DiscursivaEvaluationInput {
  themeTitle: string;
  banca?: string;
  subjectArea?: string;
  motivatingText?: string;
  expectedPoints?: string;
  content: string;
  lineCount: number;
  wordCount: number;
  durationSeconds?: number;
}

export interface DiscursivaEvaluationOutput {
  score: number;
  maxScore: number;
  notaConteudo: number;
  descontoFormal: number;
  numeroErros: number;
  isApproved: boolean;
  generalFeedback: string;
  criteriaScores: CriteriaScore[];
  lineErrors: LineError[];
  strengths: string[];
  improvements: string[];
  goldenVersion: string;
}

/**
 * Lista de termos técnicos e construções cultas protegidas contra falsos positivos de OCR/IA.
 */
const PROTECTED_FORMAL_TERMS = [
  "alienígena",
  "alienígenas",
  "não obstante",
  "compliance",
  "vendor lock-in",
  "black box",
  "xai",
  "accountability",
  "machine learning",
  "sandbox",
  "due diligence",
  "blockchain",
  "interoperabilidade",
];

/**
 * Higieniza e valida a lista de erros apontados pela IA, eliminando alucinações e sugestões vazias ou idênticas.
 */
function sanitizeLineErrors(errors: LineError[]): LineError[] {
  if (!Array.isArray(errors)) return [];

  return errors.filter((err) => {
    if (!err || typeof err !== "object") return false;
    const excerpt = (err.excerpt || "").trim();
    const suggestion = (err.suggestion || "").trim();
    const explanation = (err.explanation || "").trim().toLowerCase();

    // 1. Rejeita se o trecho for vazio ou a sugestão for idêntica ao trecho original
    if (!excerpt || !suggestion) return false;
    if (excerpt.toLowerCase() === suggestion.toLowerCase()) return false;

    // 2. Protege jargões técnicos consolidados do Direito e TI
    for (const term of PROTECTED_FORMAL_TERMS) {
      if (
        excerpt.toLowerCase().includes(term) &&
        (explanation.includes("informal") ||
          explanation.includes("extraterrestre") ||
          explanation.includes("coloquial") ||
          explanation.includes("regência") ||
          explanation.includes("desvio"))
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Avalia redação discursiva com calibração oficial CEBRASPE.
 * Aplica:
 * - Nota de Conteúdo (NC) com pontuação integral para tópicos plenamente fundamentados;
 * - Desconto Formal estrito: (2 * NúmeroDeErros) / TotalDeLinhas;
 * - Proibição expressa de alucinações terminológicas no Direito e TI.
 */
export async function evaluateDiscursivaEssay(
  input: DiscursivaEvaluationInput
): Promise<DiscursivaEvaluationOutput> {
  const {
    themeTitle,
    banca = "CEBRASPE",
    subjectArea = "Geral",
    motivatingText = "",
    expectedPoints = "",
    content,
    lineCount,
    wordCount,
    durationSeconds = 0,
  } = input;

  const cleanContent = content.trim();
  const lines = cleanContent.split("\n");
  const actualLineCount = Math.max(1, lineCount || lines.length);

  const numberedEssay = lines
    .map((l, idx) => `[Linha ${idx + 1}] ${l}`)
    .join("\n");

  const isCebraspe = banca.toUpperCase().includes("CEBRASPE") || banca.toUpperCase().includes("CESPE");

  const prompt = `Você é o examinador-chefe da banca ${banca} para correção de provas discursivas de concursos públicos de alto rendimento.
Sua missão é realizar uma avaliação técnica, justa, imparcial e absolutamente livre de preconceitos linguísticos ou alucinações terminológicas.

INFORMAÇÕES DA PROVA:
- Banca: ${banca}
- Área de Conhecimento: ${subjectArea}
- Tema Proposto: "${themeTitle}"
- Textos Motivadores:
${motivatingText || "Sem textos motivadores específicos."}
- Tópicos / Padrão de Resposta Oficial Esperado:
${expectedPoints || "Abordagem fundamentada dos aspectos temáticos, doutrina/legislação pertinente e propostas técnicas."}

REDAÇÃO DO CANDIDATO (com numeração de linhas da folha pautada):
${numberedEssay}

DADOS DA SUBMISSÃO:
- Quantidade real de linhas: ${actualLineCount}
- Total de palavras: ${wordCount}
- Tempo de execução: ${Math.round(durationSeconds / 60)} min

======================================================================
DIRETRIZES TÉCNICAS E CRITÉRIOS DE CORREÇÃO CEBRASPE (LEITURA OBRIGATÓRIA):
======================================================================

1. PROIBIÇÃO EXPRESSA DE ALUCINAÇÕES TERMINOLÓGICAS:
   - JARGÃO JURÍDICO CLÁSSICO: 'jurisdição alienígena', 'legislação alienígena', 'direito alienígena' e correlatos são termos nobres e técnicos consagrados no Direito brasileiro e na jurisprudência do STF/STJ para se referir ao direito estrangeiro. É RIGOROSAMENTE PROIBIDO classificar 'alienígena' como informal, coloquial ou aludir a extraterrestres.
   - CONECTIVOS CONCESSIVOS: 'não obstante os ganhos', 'não obstante as dificuldades' são construções de alto nível da norma culta com valor concessivo. É PROIBIDO inventar erros de regência ou exigência de preposição nesses casos.
   - JARGÃO TÉCNICO DE TI E GOVERNANÇA: Termos como 'compliance', 'vendor lock-in', 'black box', 'XAI' (Explainable AI), 'machine learning', 'accountability', 'sandbox regulatório', 'due diligence', 'interoperabilidade' são técnicos e valorizados no padrão de resposta da área de TI/Governança. Não aponte como estrangeirismo indevido.
   - RIGOR GRAMATICAL VERDADEIRO: Aponte erro de norma culta APENAS se houver desvio flagrante, incontroverso e definitivo (erro crasso de concordância verbal/nominal, erro evidente de regência, crase proibida clara, ou vírgula separando sujeito de predicado).
   - Não aponte casos facultativos ou opções estilísticas do autor como erro.

2. AVALIAÇÃO DA NOTA DE CONTEÚDO (NC) - MÁXIMO 100 PONTOS:
   - A Nota de Conteúdo (NC) avalia o desenvolvimento dos aspectos técnicos solicitados no padrão de resposta.
   - Para cada um dos tópicos esperados, gradue com equidade:
     * Nota Zero: Se não abordou o aspecto solicitado.
     * Nota Parcial: Se abordou apenas superficialmente, tangenciou ou não forneceu fundamentação normativa/doutrinária.
     * NOTA MÁXIMA DO TÓPICO: Se o candidato abordou plenamente o aspecto, citou marcos conceituais, repertório legal/doutrinário pertinente e apresentou argumentos técnicos maduros e articulados.
   - REGRA DE OURO: Se os 3 tópicos foram plenamente respondidos com maturidade técnica e sem fuga temática, o candidato DEVE RECEBER NOTA MÁXIMA EM CONTEÚDO (NC = 100.0 ou proporcional). Não penalize o conteúdo por preciosismo desmotivado!

3. SISTEMA DE DESCONTO FORMAL CEBRASPE:
   - A fórmula oficial do CEBRASPE para a nota final é:
     Nota Final = Nota de Conteúdo - Desconto Formal
     onde: Desconto Formal = (2 * NúmeroDeErros) / TotalDeLinhas
   - Identifique cada erro gramatical real na lista "lineErrors".
   - Cada erro deve conter um trecho incorreto ("excerpt") e uma sugestão da banca ("suggestion").
   - EXIGÊNCIA ABSOLUTA: A "suggestion" NUNCA PODE SER IDÊNTICA ao "excerpt". Ela deve propor uma correção concreta e gramaticalmente superior.

Retorne EXCLUSIVAMENTE um objeto JSON estrito:
{
  "notaConteudo": 95.0,
  "generalFeedback": "Parecer geral detalhado em 2 a 3 parágrafos fundamentando a pontuação...",
  "criteriaScores": [
    {
      "name": "Apresentação e Estrutura Textual",
      "maxScore": 10,
      "awardedScore": 10,
      "comments": "Justificativa detalhada da legibilidade, respeito às margens e estrutura em parágrafos..."
    },
    {
      "name": "Aspecto 1: [Título resumido do Tópico 1]",
      "maxScore": 30,
      "awardedScore": 30,
      "comments": "Grau de atendimento ao aspecto 1 (pleno / parcial)..."
    },
    {
      "name": "Aspecto 2: [Título resumido do Tópico 2]",
      "maxScore": 30,
      "awardedScore": 30,
      "comments": "Grau de atendimento ao aspecto 2 (pleno / parcial)..."
    },
    {
      "name": "Aspecto 3: [Título resumido do Tópico 3]",
      "maxScore": 30,
      "awardedScore": 30,
      "comments": "Grau de atendimento ao aspecto 3 (pleno / parcial)..."
    }
  ],
  "lineErrors": [
    {
      "line": 4,
      "excerpt": "trecho exato da redação",
      "errorType": "Gramática" | "Pontuação" | "Crase" | "Concordância" | "Regência" | "Coesão" | "Vocabulário" | "Estrutura",
      "explanation": "Explicação gramatical técnica objetiva e fundamentada.",
      "suggestion": "Trecho reescrito corrigido (OBRIGATORIAMENTE DIFERENTE do excerpt)"
    }
  ],
  "strengths": [
    "Ponto forte 1...",
    "Ponto forte 2..."
  ],
  "improvements": [
    "Oportunidade de melhoria 1...",
    "Oportunidade de melhoria 2..."
  ],
  "goldenVersion": "Texto completo da redação refinado no padrão nota 100 da banca..."
}`;

  const { text } = await generateContentWithFallback({
    prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1, // Temperatura baixa para estabilidade e fidelidade analítica
      maxOutputTokens: 4000,
    },
    timeoutMs: 65000,
    preferredModels: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
    ],
  });

  let parsed: any;
  try {
    let cleanJson = text.trim();
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    throw new Error("A IA retornou um formato inválido de avaliação discursiva.");
  }

  // 1. Sanitiza a lista de erros de linha
  const rawLineErrors: LineError[] = Array.isArray(parsed.lineErrors) ? parsed.lineErrors : [];
  const validLineErrors = sanitizeLineErrors(rawLineErrors);
  const numeroErros = validLineErrors.length;

  // 2. Calcula a Nota de Conteúdo (NC)
  let notaConteudo = Number(parsed.notaConteudo);
  if (isNaN(notaConteudo) || notaConteudo <= 0) {
    // Se não veio explicitamente, soma os critérios
    const criteriaSum = Array.isArray(parsed.criteriaScores)
      ? parsed.criteriaScores.reduce((acc: number, c: any) => acc + (Number(c.awardedScore) || 0), 0)
      : Number(parsed.score) || 80;
    notaConteudo = Math.min(100, Math.max(0, criteriaSum));
  } else {
    notaConteudo = Math.min(100, Math.max(0, notaConteudo));
  }

  // 3. Aplica a Fórmula Oficial CEBRASPE: Desconto = (2 * NúmeroDeErros) / TotalDeLinhas
  const descontoFormal = isCebraspe
    ? Math.round(((2 * numeroErros) / actualLineCount) * 100) / 100
    : Math.round(((2 * numeroErros) / actualLineCount) * 100) / 100;

  // 4. Calcula a Nota Final Oficial
  const finalScore = Math.max(0, Math.round((notaConteudo - descontoFormal) * 100) / 100);
  const isApproved = finalScore >= 60.0;

  // 5. Assegura que criteriaScores contenha o critério formal atualizado com a fórmula
  const criteriaScores: CriteriaScore[] = Array.isArray(parsed.criteriaScores)
    ? parsed.criteriaScores.map((c: any) => ({
        name: String(c.name || "Aspecto Técnico"),
        maxScore: Number(c.maxScore) || 25,
        awardedScore: Number(c.awardedScore) || 0,
        comments: String(c.comments || ""),
      }))
    : [];

  return {
    score: finalScore,
    maxScore: 100,
    notaConteudo,
    descontoFormal,
    numeroErros,
    isApproved,
    generalFeedback: parsed.generalFeedback || "Avaliação técnica realizada com sucesso.",
    criteriaScores,
    lineErrors: validLineErrors,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    goldenVersion: parsed.goldenVersion || "",
  };
}
