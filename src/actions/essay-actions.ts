"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { recordStudyActivityAction } from "./gamification-actions";
import { sanitizeOcrTranscription } from "@/lib/essay-ocr-utils";

export interface MotivatingText {
  title: string;
  source?: string;
  content: string;
}

export interface EssayTheme {
  title: string;
  banca: string;
  subjectArea: string;
  motivatingTexts: MotivatingText[];
  expectedTopics: string[];
  instructions: string[];
}

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

export interface EssayEvaluationResult {
  id: string;
  themeTitle: string;
  banca: string;
  subjectArea?: string | null;
  motivatingText?: string | null;
  expectedPoints?: string | null;
  content: string;
  lineCount: number;
  wordCount: number;
  durationSeconds: number;
  score: number;
  maxScore: number;
  isApproved: boolean;
  generalFeedback: string;
  criteriaScores: CriteriaScore[];
  lineErrors: LineError[];
  strengths: string[];
  improvements: string[];
  goldenVersion: string;
  createdAt: string;
  xpEarned?: number;
}

/**
 * 1. Gera uma proposta de redação com tema quente, textos motivadores e tópicos da banca
 */
export async function generateEssayThemeAction(params: {
  banca?: string;
  subjectArea?: string;
  customKeyword?: string;
}): Promise<{ success: boolean; data?: EssayTheme; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado." };
    }

    const banca = params.banca || "CEBRASPE";
    const area = params.subjectArea || "Segurança Pública / Policial";
    const customKeyword = params.customKeyword?.trim();

    const prompt = `
Você é um elaborador sênior de provas discursivas de concursos públicos renomados no Brasil (como Cebraspe, FGV, FCC, Cesgranrio, Vunesp).
Crie uma proposta de redação inédita, contemporânea e de altíssima probabilidade de cobrança para a banca ${banca} na área "${area}"${
      customKeyword ? ` com foco no seguinte assunto: "${customKeyword}"` : ""
    }.

A proposta deve seguir estritamente o modelo de prova oficial de concurso:
1. Tema central conciso e impactante.
2. Dois ou três Textos Motivadores (Texto I: recorte conceitual ou doutrinário; Texto II: dados estatísticos, fatos recentes ou dispositivo legal).
3. De 2 a 3 Tópicos Norteadores Obrigatórios (Padrão de Resposta da banca, ex: Cebraspe: "Ao elaborar seu texto, aborde necessariamente os seguintes aspectos: 1. ..., 2. ..., 3. ...").
4. Instruções oficiais de prova (limite de 20 a 30 linhas, caneta preta, texto dissertativo-argumentativo).

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown de código fora do JSON) com a seguinte estrutura:
{
  "title": "Tema completo da redação",
  "banca": "${banca}",
  "subjectArea": "${area}",
  "motivatingTexts": [
    {
      "title": "Texto I - Título",
      "source": "Fonte do texto (ex: Ipea, 2025)",
      "content": "Parágrafo do texto motivador..."
    },
    {
      "title": "Texto II - Dados e Legislação",
      "source": "Fonte (ex: Anuário Brasileiro de Segurança Pública, 2025)",
      "content": "Parágrafo com dados e contexto..."
    }
  ],
  "expectedTopics": [
    "1. Aspecto obrigatório 1",
    "2. Aspecto obrigatório 2",
    "3. Aspecto obrigatório 3"
  ],
  "instructions": [
    "A redação deverá ser manuscrita em letra legível, com caneta esferográfica de tinta preta.",
    "O texto deve ser dissertativo-argumentativo e conter no mínimo 20 e no máximo 30 linhas.",
    "A folha de texto definitivo não pode conter rasuras ou marcas que identifiquem o candidato."
  ]
}
`;

    const { text } = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2500,
      },
      timeoutMs: 45000,
    });

    const parsed = JSON.parse(text) as EssayTheme;
    return { success: true, data: parsed };
  } catch (error) {
    console.error("[generateEssayThemeAction] Erro ao gerar tema:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao gerar proposta com IA. Tente novamente.",
    };
  }
}

/**
 * 2. Avalia a redação de forma rigorosa e honesta segundo critérios de banca examinadora
 */
export async function evaluateEssayAction(payload: {
  themeTitle: string;
  banca?: string;
  subjectArea?: string;
  motivatingText?: string;
  expectedPoints?: string;
  content: string;
  lineCount: number;
  wordCount: number;
  durationSeconds: number;
}): Promise<{ success: boolean; data?: EssayEvaluationResult; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const {
      themeTitle,
      banca = "CEBRASPE",
      subjectArea = "Geral",
      motivatingText = "",
      expectedPoints = "",
      content,
      lineCount,
      wordCount,
      durationSeconds,
    } = payload;

    const cleanContent = content.trim();
    if (!cleanContent || cleanContent.length < 100 || wordCount < 30) {
      return {
        success: false,
        error: "A redação precisa conter no mínimo 30 palavras para ser avaliada pela banca.",
      };
    }

    // Monta o texto enumerado linha por linha para que o Gemini analise exatamente a linha do aluno
    const lines = cleanContent.split("\n");
    const numberedEssay = lines
      .map((l, idx) => `[Linha ${idx + 1}] ${l}`)
      .join("\n");

    const prompt = `
Você é o examinador-chefe de redações da banca examinadora ${banca} para concursos públicos.
Sua missão é realizar uma AVALIAÇÃO IMPARCIAL, RIGOROSA E 100% HONESTA da redação do candidato.
NÃO facilite, NÃO passe pano e NÃO infle a nota. Se o candidato cometeu erros de crase, regência, concordância, usou conectivos de forma mecânica, foi superficial ou tangenciou os tópicos exigidos, PENALIZE SEVERAMENTE. O candidato precisa da verdade crua para evoluir e não ser desclassificado na prova real.

INFORMAÇÕES DA PROVA:
- Banca: ${banca}
- Área: ${subjectArea}
- Tema Proposto: "${themeTitle}"
- Textos Motivadores Fornecidos:
${motivatingText || "Sem textos motivadores adicionais."}
- Tópicos / Padrão de Resposta Esperado pela Banca:
${expectedPoints || "Abordagem crítica fundamentada, contextualização doutrinária/legal e intervenção prática."}

REDAÇÃO DO CANDIDATO (com numeração de linhas):
${numberedEssay}

DADOS DA SUBMISSÃO:
- Quantidade de linhas escritas: ${lineCount}
- Total de palavras: ${wordCount}
- Tempo de prova gasto: ${Math.round(durationSeconds / 60)} minutos

REGRAS DE PONTUAÇÃO (Escala Oficial de 0 a 100):
Avalie nos seguintes 4 critérios oficiais:
1. "Apresentação, Estrutura e Coesão Textual (Forma e Gênero)" (máximo: 25.0 pontos):
   - Avalia paragrafação nítida (introdução, 2 desenvolvimentos, conclusão), respeito ao limite de linhas (20 a 30 linhas), legibilidade e progressão lógica sem truncamento. Se escreveu menos de 20 linhas ou mais de 30 linhas, penalize fortemente.
2. "Domínio da Norma Padrão da Língua Portuguesa" (máximo: 25.0 pontos):
   - Avalia acentuação, ortografia, crase, concordância verbal/nominal, regência verbal/nominal, pontuação (especialmente vírgulas entre sujeito e predicado) e precisão vocabular. Desconte cerca de 1.0 a 2.0 pontos por cada erro gramatical identificável.
3. "Desenvolvimento do Tema, Argumentação e Conteúdo" (máximo: 30.0 pontos):
   - Avalia se o aluno respondeu diretamente a CADA UM dos tópicos esperados, se trouxe repertório sociocultural legítimo (leis, filósofos, dados, jurisprudência) e se defendeu um ponto de vista sem cair no senso comum. Se tangenciou ou ignorou algum tópico, desconte substancialmente.
4. "Coesão, Coerência e Conclusão Propositiva" (máximo: 20.0 pontos):
   - Avalia o uso diversificado de operadores argumentativos interparágrafos ("Outrossim", "Por conseguinte", "Nesse prisma", "Em contrapartida"), ausência de períodos excessivamente longos e uma conclusão consistente.

REQUISITOS OBRIGATÓRIOS DO RETORNO:
- Nota final de 0.0 a 100.0 (Aprovado se >= 60.0, Eliminado se < 60.0).
- Parecer geral honesto e construtivo de 2 a 3 parágrafos sintetizando a avaliação da banca.
- Lista detalhada de erros identificados linha a linha ("lineErrors"): para cada erro gramatical, sintático ou coesivo, aponte o número exato da linha, o trecho incorreto, o tipo de erro, a explicação técnica e como reescrever.
- Pontos Fortes (o que o candidato fez bem e deve manter).
- Pontos Críticos (os erros mais perigosos que o eliminariam na prova).
- Versão Padrão Ouro ("goldenVersion"): reescreva a redação completa com as MESMAS ideias centrais do aluno, mas no padrão nota 100 da banca, com vocabulário formal impecável, conectivos perfeitos e períodos equilibrados.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem comentários e sem markdown fora do JSON):
{
  "score": 76.5,
  "maxScore": 100,
  "isApproved": true,
  "generalFeedback": "Parecer geral detalhado...",
  "criteriaScores": [
    {
      "name": "Apresentação, Estrutura e Gênero Textual",
      "maxScore": 25,
      "awardedScore": 20.5,
      "comments": "Justificativa da pontuação..."
    },
    {
      "name": "Domínio da Norma Padrão da Língua Portuguesa",
      "maxScore": 25,
      "awardedScore": 18.0,
      "comments": "Justificativa com menção aos erros gramaticais..."
    },
    {
      "name": "Desenvolvimento do Tema e Repertório",
      "maxScore": 30,
      "awardedScore": 24.0,
      "comments": "Justificativa da cobertura dos tópicos..."
    },
    {
      "name": "Coesão, Coerência e Conclusão",
      "maxScore": 20,
      "awardedScore": 14.0,
      "comments": "Justificativa da articulação entre parágrafos..."
    }
  ],
  "lineErrors": [
    {
      "line": 4,
      "excerpt": "onde a sociedade busca",
      "errorType": "Coesão",
      "explanation": "O pronome 'onde' só deve ser empregado para retomar lugares físicos e concretos.",
      "suggestion": "em que a sociedade busca / no qual a sociedade busca"
    }
  ],
  "strengths": [
    "Boa articulação do repertório constitucional no primeiro parágrafo.",
    "Paragrafação simétrica e visualmente equilibrada."
  ],
  "improvements": [
    "Atenção ao uso indevido da vírgula separando sujeito e predicado na linha 12.",
    "Aprofundar a resposta ao Tópico 2, que ficou superficial."
  ],
  "goldenVersion": "Texto completo reescrito no padrão nota máxima..."
}
`;

    const { text } = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 4000,
      },
      timeoutMs: 65000,
    });

    const parsed = JSON.parse(text);

    const calculatedScore = Number(parsed.score) || 0;
    const isApproved = calculatedScore >= 60;

    // 3. Salva no banco de dados
    const submission = await prisma.essaySubmission.create({
      data: {
        userId,
        themeTitle,
        banca,
        subjectArea,
        motivatingText: motivatingText || null,
        expectedPoints: expectedPoints || null,
        content: cleanContent,
        lineCount,
        wordCount,
        durationSeconds,
        score: calculatedScore,
        maxScore: 100,
        isApproved,
        generalFeedback: parsed.generalFeedback || "",
        criteriaScores: parsed.criteriaScores || [],
        lineErrors: parsed.lineErrors || [],
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        goldenVersion: parsed.goldenVersion || "",
        status: "EVALUATED",
      },
    });

    // 4. Concede XP na Gamificação (+120 XP por redação completa corrigida)
    const xpReward = 120;
    const sessionMinutes = Math.max(15, Math.round(durationSeconds / 60));
    try {
      await recordStudyActivityAction(userId, xpReward, "ESSAY", sessionMinutes);
    } catch (xpErr) {
      console.warn("[evaluateEssayAction] Aviso ao conceder XP:", xpErr);
    }

    return {
      success: true,
      data: {
        id: submission.id,
        themeTitle: submission.themeTitle,
        banca: submission.banca,
        subjectArea: submission.subjectArea,
        motivatingText: submission.motivatingText,
        expectedPoints: submission.expectedPoints,
        content: submission.content,
        lineCount: submission.lineCount,
        wordCount: submission.wordCount,
        durationSeconds: submission.durationSeconds || 0,
        score: submission.score ?? calculatedScore,
        maxScore: submission.maxScore,
        isApproved: submission.isApproved ?? isApproved,
        generalFeedback: submission.generalFeedback || "",
        criteriaScores: (submission.criteriaScores as unknown as CriteriaScore[]) || [],
        lineErrors: (submission.lineErrors as unknown as LineError[]) || [],
        strengths: (submission.strengths as unknown as string[]) || [],
        improvements: (submission.improvements as unknown as string[]) || [],
        goldenVersion: submission.goldenVersion || "",
        createdAt: submission.createdAt.toISOString(),
        xpEarned: xpReward,
      },
    };
  } catch (error) {
    console.error("[evaluateEssayAction] Erro ao avaliar redação:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao avaliar redação com IA.",
    };
  }
}

/**
 * 3. Recupera o histórico de redações do usuário logado
 */
export async function getUserEssaysHistoryAction(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    themeTitle: string;
    banca: string;
    subjectArea?: string | null;
    score: number | null;
    maxScore: number;
    isApproved: boolean | null;
    lineCount: number;
    wordCount: number;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado." };
    }

    const essays = await prisma.essaySubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        themeTitle: true,
        banca: true,
        subjectArea: true,
        score: true,
        maxScore: true,
        isApproved: true,
        lineCount: true,
        wordCount: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: essays.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("[getUserEssaysHistoryAction] Erro:", error);
    return { success: false, error: "Falha ao buscar histórico de redações." };
  }
}

/**
 * 4. Obtém os detalhes completos de uma redação específica
 */
export async function getEssaySubmissionByIdAction(id: string): Promise<{
  success: boolean;
  data?: EssayEvaluationResult;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado." };
    }

    const essay = await prisma.essaySubmission.findUnique({
      where: { id },
    });

    if (!essay || essay.userId !== session.user.id) {
      return { success: false, error: "Redação não encontrada." };
    }

    return {
      success: true,
      data: {
        id: essay.id,
        themeTitle: essay.themeTitle,
        banca: essay.banca,
        subjectArea: essay.subjectArea,
        motivatingText: essay.motivatingText,
        expectedPoints: essay.expectedPoints,
        content: essay.content,
        lineCount: essay.lineCount,
        wordCount: essay.wordCount,
        durationSeconds: essay.durationSeconds || 0,
        score: essay.score || 0,
        maxScore: essay.maxScore,
        isApproved: essay.isApproved ?? (essay.score ? essay.score >= 60 : false),
        generalFeedback: essay.generalFeedback || "",
        criteriaScores: (essay.criteriaScores as unknown as CriteriaScore[]) || [],
        lineErrors: (essay.lineErrors as unknown as LineError[]) || [],
        strengths: (essay.strengths as unknown as string[]) || [],
        improvements: (essay.improvements as unknown as string[]) || [],
        goldenVersion: essay.goldenVersion || "",
        createdAt: essay.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[getEssaySubmissionByIdAction] Erro:", error);
    return { success: false, error: "Falha ao recuperar a redação." };
  }
}

/**
 * 5. Deleta uma redação do histórico
 */
export async function deleteEssayAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado." };
    }

    await prisma.essaySubmission.deleteMany({
      where: { id, userId: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error("[deleteEssayAction] Erro ao deletar redação:", error);
    return { success: false, error: "Falha ao excluir redação." };
  }
}

export interface TranscribeHandwrittenEssayResponse {
  success: boolean;
  error?: string;
  transcription?: string;
  detectedLines?: number;
  legibility?: "Alta" | "Média" | "Baixa";
  observations?: string;
}

/**
 * 6. Transcreve uma folha de redação manuscrita via OCR Multimodal com Gemini
 */
export async function transcribeHandwrittenEssayAction(
  formData: FormData
): Promise<TranscribeHandwrittenEssayResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "Nenhuma foto de redação foi enviada." };
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Formato inválido. Por favor, envie uma foto em JPG, PNG ou WEBP.",
      };
    }

    if (file.size > 15 * 1024 * 1024) {
      return {
        success: false,
        error: "A foto é maior que 15MB. Envie uma foto menor ou com menor resolução.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `Você é o maior especialista do Brasil em leitura paleográfica e transcrição de redações manuscritas de concursos públicos (Cebraspe, FGV, FCC, Vunesp).
Analise com rigor extremo a imagem da folha pautada oficial anexada.
Sua missão é transcrever com a máxima fidelidade a redação manuscrita, linha por linha (exatamente como o candidato escreveu nas linhas pautadas 1 a 30).

DIRETRIZES PALEOGRÁFICAS CRÍTICAS DE CALIGRAFIA CURSIVA BRASILEIRA:
1. ALERTA DE 's' CURSIVO vs 'k':
   Na caligrafia cursiva brasileira, a letra 's' minúscula frequentemente possui uma haste vertical com laço ascendente que modelos ópticos confundem erroneamente com 'k'.
   EM LÍNGUA PORTUGUESA NÃO EXISTE 'k' EM CLÍTICOS, PRONOMES, CONJUNÇÕES OU DESINÊNCIAS.
   - Reconheça rigorosamente ênclises com '-se':
     * 'configura-se' (NUNCA 'configura-k')
     * 'observa-se' / 'ob-serva-se' (NUNCA 'ob-serva-k')
     * 'encaixa-se' (NUNCA 'encaixa-k')
     * 'trata-se', 'espera-se', etc.
   - Reconheça mesóclises com '-se-':
     * 'poder-se-á' (NUNCA 'poder-k-á')
     * 'far-se-á', 'esperar-se-ia', etc.
   - Reconheça a conjunção condicional 'se':
     * 'se um indivíduo' (NUNCA 'k um indivíduo')
     * 'seja pela' (NUNCA 'kja pela')

2. CONCORDÂNCIA E DESINÊNCIAS CURSIVAS ('o' vs 'a'):
   O laço superior de 'o' não deve ser confundido com 'a' quando a concordância gramatical for clara (ex: 'de surdos matriculados', e não 'surdas matriculados'; 'na teoria do sociólogo', e não 'no teoria').

3. TRATAMENTO DE RASURAS DE CONCURSO:
   Em provas discursivas, candidatos corrigem palavras passando um traço simples horizontal ou parênteses e escrevendo o termo correto ao lado.
   - REGRA: Identifique o termo rasurado e o termo corrigido. Transcreva APENAS o termo corrigido válido pretendido pelo candidato (ex: se o candidato escreveu 'exercer(em pleno) plenamente' ou riscou uma palavra, transcreva 'exercerem plenamente' ou 'exercer plenamente').
   - NUNCA junte partes da palavra riscada com a nova gerando palavras inexistentes como 'exercercromptend'.

4. IDENTAÇÃO DE PARÁGRAFOS:
   Preserve o recuo dos parágrafos iniciando a primeira linha de cada parágrafo com 4 espaços ("    Texto...").

5. ESTRITAMENTE UMA LINHA DA FOLHA POR LINHA DE TEXTO:
   - A folha pautada possui linhas numeradas de 1 a 30 na margem esquerda.
   - Cada linha física que o candidato escreveu na folha deve corresponder a exatamente UMA linha no campo "transcription", separadas por \\n.
   - Mantenha hifens de translineação no final das linhas exatamente como o candidato grafou (ex: 'desa-', 'cul-', 'proble-').
   - NUNCA adicione linhas vazias ou em branco após o término da redação. Se o candidato escreveu até a linha 29, a transcrição deve terminar exatamente na linha 29.

6. FIDELIDADE E CASOS ILEGÍVEIS:
   - Preserve a grafia real do candidato.
   - Se um trecho estiver de fato ilegível após análise minuciosa, marque como [ilegível].

Retorne em formato JSON estrito:
{
  "transcription": "Texto transcrito linha por linha (1 a 30) separado por \\n",
  "detectedLines": 29,
  "legibility": "Alta" | "Média" | "Baixa",
  "observations": "Observação rápida sobre a caligrafia, respeito às margens e organização dos parágrafos"
}`;

    const response = await generateContentWithFallback({
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Baixa temperatura para precisão cirúrgica e sem alucinações
      },
      preferredModels: [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
      ],
    });

    if (!response || !response.text) {
      throw new Error("A IA não retornou a transcrição da folha.");
    }

    let text = response.text.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    if (text.startsWith("```")) text = text.replace(/^```/, "").replace(/```$/, "").trim();

    const parsed = JSON.parse(text) as {
      transcription: string;
      detectedLines: number;
      legibility: "Alta" | "Média" | "Baixa";
      observations: string;
    };

    const sanitizedTranscription = sanitizeOcrTranscription(parsed.transcription);

    return {
      success: true,
      transcription: sanitizedTranscription,
      detectedLines: parsed.detectedLines,
      legibility: parsed.legibility,
      observations: parsed.observations,
    };
  } catch (err: unknown) {
    console.error("[transcribeHandwrittenEssayAction] Erro:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erro ao processar a imagem da redação manuscrita.",
    };
  }
}
