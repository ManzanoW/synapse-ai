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

export interface BancaMethodologyBreakdown {
  label: string;
  value: string | number;
  detail?: string;
}

export interface BancaMethodology {
  bancaName: string;
  formulaName: string;
  formulaDisplay: string;
  formulaExplanation: string;
  detailedBreakdown: BancaMethodologyBreakdown[];
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
  bancaMethodology?: BancaMethodology;
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

  // 3. Aplica a Fórmula Oficial Calibrada da Banca
  const upperBanca = (banca || "").toUpperCase();
  const isFGV = upperBanca.includes("FGV");
  const isFCC = upperBanca.includes("FCC");

  let formulaName = "";
  let formulaDisplay = "";
  let formulaExplanation = "";
  let descontoFormal = 0;
  let finalScore = 0;
  let detailedBreakdown: BancaMethodologyBreakdown[] = [];

  if (isCebraspe) {
    formulaName = "Fórmula Oficial CEBRASPE: NF = NC - 2 × (NE / TL)";
    descontoFormal = Math.round(((2 * numeroErros) / actualLineCount) * 100) / 100;
    finalScore = Math.max(0, Math.round((notaConteudo - descontoFormal) * 100) / 100);
    formulaDisplay = `NF = ${notaConteudo.toFixed(1)} - 2 × (${numeroErros} / ${actualLineCount}) = ${finalScore.toFixed(2)}`;
    formulaExplanation = "O Cebraspe calcula a nota final deduzindo duas vezes o número de erros gramaticais (NE) dividido pelo total de linhas escritas (TL).";
    detailedBreakdown = [
      { label: "Nota de Conteúdo (NC)", value: `${notaConteudo.toFixed(1)} / 100.0 pts`, detail: "Atendimento pleno aos tópicos da proposta temática" },
      { label: "Total de Linhas (TL)", value: `${actualLineCount} linhas`, detail: "Linhas efetivamente redigidas na folha definitiva" },
      { label: "Erros Gramaticais (NE)", value: `${numeroErros} ${numeroErros === 1 ? "erro" : "erros"}`, detail: "Falhas gramaticais e de coesão apontadas na correção" },
      { label: "Desconto Formal", value: `-${descontoFormal.toFixed(2)} pts`, detail: `2 × ${numeroErros} ÷ ${actualLineCount}` },
      { label: "Nota Final Líquida (NF)", value: `${finalScore.toFixed(2)} / 100.0 pts`, detail: finalScore >= 60 ? "Classificado na discursiva" : "Abaixo da nota de corte mínima (60.0)" },
    ];
  } else if (isFGV) {
    formulaName = "Espelho Oficial FGV: Parte I (Conteúdo/60) + Parte II (Expressão/40)";
    const parteConteudo = Math.round(((notaConteudo * 60) / 100) * 10) / 10;
    const descontoPorErro = 1.0;
    descontoFormal = Math.round((numeroErros * descontoPorErro) * 10) / 10;
    const parteExpressao = Math.max(0, Math.round((40 - descontoFormal) * 10) / 10);
    finalScore = Math.min(100, Math.max(0, Math.round((parteConteudo + parteExpressao) * 10) / 10));
    formulaDisplay = `NF = ${parteConteudo.toFixed(1)} (Conteúdo) + ${parteExpressao.toFixed(1)} (Expressão) = ${finalScore.toFixed(1)}`;
    formulaExplanation = "A FGV divide a prova em Conteúdo (60 pts) e Expressão/Norma Culta (40 pts). Cada desvio gramatical acarreta desconto direto de 1,0 ponto na nota de expressão.";
    detailedBreakdown = [
      { label: "Parte I: Conteúdo & Estrutura", value: `${parteConteudo.toFixed(1)} / 60.0 pts`, detail: "Tema, informatividade, argumentação e progressão textual" },
      { label: "Parte II: Expressão Escrita", value: `${parteExpressao.toFixed(1)} / 40.0 pts`, detail: `Base 40 pts deduzida de ${numeroErros} erro(s)` },
      { label: "Desconto Formal por Falhas", value: `-${descontoFormal.toFixed(1)} pts`, detail: `${numeroErros} desvio(s) formal(is) × 1.0 pt` },
      { label: "Nota Final Consolidada", value: `${finalScore.toFixed(1)} / 100.0 pts`, detail: finalScore >= 60 ? "Classificado na discursiva" : "Abaixo do mínimo exigido (60.0)" },
    ];
  } else if (isFCC) {
    formulaName = "Padrão Oficial FCC: Conteúdo (40) + Estrutura (30) + Expressão (30)";
    const parteConteudo = Math.round(((notaConteudo * 40) / 100) * 10) / 10;
    const parteEstrutura = Math.round(((Math.min(100, notaConteudo + 5) * 30) / 100) * 10) / 10;
    const descontoPorErro = 0.75;
    descontoFormal = Math.round((numeroErros * descontoPorErro) * 100) / 100;
    const parteExpressao = Math.max(0, Math.round((30 - descontoFormal) * 10) / 10);
    finalScore = Math.min(100, Math.max(0, Math.round((parteConteudo + parteEstrutura + parteExpressao) * 10) / 10));
    formulaDisplay = `NF = ${parteConteudo.toFixed(1)} (Conteúdo) + ${parteEstrutura.toFixed(1)} (Estrutura) + ${parteExpressao.toFixed(1)} (Expressão) = ${finalScore.toFixed(1)}`;
    formulaExplanation = "A FCC avalia Conteúdo (40 pts), Estrutura dissertativa (30 pts) e Expressão (30 pts), descontando 0,75 ponto por desvio gramatical na nota de expressão.";
    detailedBreakdown = [
      { label: "Critério A: Conteúdo", value: `${parteConteudo.toFixed(1)} / 40.0 pts`, detail: "Consistência e pertinência temática" },
      { label: "Critério B: Estrutura", value: `${parteEstrutura.toFixed(1)} / 30.0 pts`, detail: "Organização em parágrafos e coesão" },
      { label: "Critério C: Expressão", value: `${parteExpressao.toFixed(1)} / 30.0 pts`, detail: `Base 30 pts deduzida de ${descontoFormal.toFixed(2)} pts` },
      { label: "Nota Final Oficial", value: `${finalScore.toFixed(1)} / 100.0 pts`, detail: finalScore >= 60 ? "Aprovado na discursiva" : "Abaixo da nota de corte (60.0)" },
    ];
  } else {
    formulaName = `Padrão ${banca || "Oficial"}: Conteúdo (70) + Norma Padrão (30)`;
    const parteConteudo = Math.round(((notaConteudo * 70) / 100) * 10) / 10;
    descontoFormal = Math.round((numeroErros * 1.0) * 10) / 10;
    const parteGramatica = Math.max(0, Math.round((30 - descontoFormal) * 10) / 10);
    finalScore = Math.min(100, Math.max(0, Math.round((parteConteudo + parteGramatica) * 10) / 10));
    formulaDisplay = `NF = ${parteConteudo.toFixed(1)} (Conteúdo) + ${parteGramatica.toFixed(1)} (Norma Padrão) = ${finalScore.toFixed(1)}`;
    formulaExplanation = `Avaliação no padrão ${banca}, ponderando desenvolvimento temático (70%) e domínio da norma culta com descontos por falhas apontadas (30%).`;
    detailedBreakdown = [
      { label: "Desenvolvimento Temático", value: `${parteConteudo.toFixed(1)} / 70.0 pts`, detail: "Abordagem dos conceitos e atendimento à proposta" },
      { label: "Norma Padrão e Coesão", value: `${parteGramatica.toFixed(1)} / 30.0 pts`, detail: `30 pts deduzidos de ${descontoFormal.toFixed(1)} pts` },
      { label: "Nota Final Oficial", value: `${finalScore.toFixed(1)} / 100.0 pts`, detail: finalScore >= 60 ? "Aprovado na discursiva" : "Abaixo da nota mínima (60.0)" },
    ];
  }

  const isApproved = finalScore >= 60.0;

  // 4. Assegura que criteriaScores contenha os critérios oficiais
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
    bancaMethodology: {
      bancaName: banca,
      formulaName,
      formulaDisplay,
      formulaExplanation,
      detailedBreakdown,
    },
  };
}
