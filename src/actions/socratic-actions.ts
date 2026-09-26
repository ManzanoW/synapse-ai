// src/actions/socratic-actions.ts
"use server";

import { generateContentWithFallback } from "@/lib/gemini-fallback";

interface SocraticHintInput {
  questionText: string;
  options?: Array<{ id: string; texto: string }>;
  subject?: string;
  banca?: string;
}

export interface SocraticHintResponse {
  success: boolean;
  hint?: string;
  guidingQuestion?: string;
  error?: string;
}

/**
 * Gera uma pista socrática em tempo real para o candidato sem revelar a alternativa correta.
 */
export async function getSocraticHintAction(
  input: SocraticHintInput
): Promise<SocraticHintResponse> {
  try {
    const prompt = `
Você é o "Tutor Socrático de Concursos de Elite" da plataforma Synapse AI.
Um concurseiro está resolvendo a questão abaixo e solicitou uma PISTA SOCRÁTICA para clarear o raciocínio.

REGRAS ESTRITAS:
1. NUNCA diga qual é a alternativa correta ou a letra do gabarito.
2. NUNCA transcreva o texto da alternativa correta.
3. Formule uma orientação curta (máximo de 3 parágrafos breves ou tópicos):
   - Primeiro, destaque o conceito-chave da disciplina/doutrina/lei que a questão exige.
   - Em seguida, faça uma pergunta reflexiva socrática que leve o candidato a identificar o erro das pegadinhas por conta própria.
4. Tom profissional, motivador, direto ao ponto e de alto nível para concurseiros.

DADOS DA QUESTÃO:
Disciplina/Assunto: ${input.subject || "Geral"}
Banca Examinadora: ${input.banca || "Geral"}
Enunciado da Questão:
"""
${input.questionText}
"""

Responda em formato de texto limpo e direto, sem cabeçalhos desnecessários.
`;

    const { text } = await generateContentWithFallback({
      prompt,
      timeoutMs: 30000,
    });

    return {
      success: true,
      hint: text.trim(),
    };
  } catch (err: unknown) {
    console.error("Erro ao gerar pista socrática:", err);
    return {
      success: false,
      error: "Não foi possível gerar a pista socrática no momento.",
    };
  }
}

interface ExplainAlternativeInput {
  questionText: string;
  optionId: string;
  optionText: string;
  correctAnswer: string;
  explanation?: string;
  subject?: string;
  banca?: string;
}

export interface AlternativeExplanation {
  isCorrect: boolean;
  trapAnalysis: string;
  criticalDetail: string;
  mnemonicTip: string;
}

export interface ExplainAlternativeResponse {
  success: boolean;
  data?: AlternativeExplanation;
  error?: string;
}

/**
 * Dissecar cirurgicamente uma alternativa específica escolhida pelo candidato.
 */
export async function explainAlternativeAction(
  input: ExplainAlternativeInput
): Promise<ExplainAlternativeResponse> {
  try {
    const isCorrect = input.optionId.toUpperCase() === input.correctAnswer.toUpperCase();

    const prompt = `
Você é o "Especialista em Pegadinhas de Bancas de Concurso" da Synapse AI.
O candidato solicitou uma dissecação detalhada e cirúrgica sobre a ALTERNATIVA ${input.optionId}.

DADOS DA QUESTÃO:
Disciplina: ${input.subject || "Conhecimentos Gerais"}
Banca Examinadora: ${input.banca || "Geral"}
Enunciado:
"""
${input.questionText}
"""

ALTERNATIVA ANALISADA:
Letra: ${input.optionId}
Texto da Alternativa:
"""
${input.optionText}
"""

GABARITO OFICIAL: ${input.correctAnswer} (${isCorrect ? "Esta é a alternativa CORRETA" : "Esta é uma alternativa INCORRETA"})
Justificativa Oficial do Gabarito: ${input.explanation || "Sem justificativa cadastrada"}

INSTRUÇÕES:
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem formatações markdown em volta) com a seguinte estrutura:
{
  "trapAnalysis": "${isCorrect ? "Explicação de por que esta alternativa é a correta e como o candidato reconhece a precisão técnica da banca." : "Qual a pegadinha, distração ou inversão sutil que a banca montou nesta alternativa para induzir o concurseiro ao erro."}",
  "criticalDetail": "A palavra-chave, exceção, prazo, artigo ou detalhe doutrinário que define a veracidade ou falsidade desta assertiva.",
  "mnemonicTip": "Um macete mnemônico, regra prática ou dica de prova para nunca mais esquecer ou cair nessa armadilha em concursos públicos."
}
`;

    const { text } = await generateContentWithFallback({
      prompt,
      timeoutMs: 35000,
    });

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      success: true,
      data: {
        isCorrect,
        trapAnalysis: parsed.trapAnalysis || "Análise detalhada da pegadinha formulada pelo examinador.",
        criticalDetail: parsed.criticalDetail || "Atenção aos termos restritivos e exceções da lei.",
        mnemonicTip: parsed.mnemonicTip || "Memorize o núcleo do dispositivo para acertar em prova.",
      },
    };
  } catch (err: unknown) {
    console.error("Erro ao dissecar alternativa:", err);
    return {
      success: false,
      error: "Não foi possível dissecar a alternativa no momento.",
    };
  }
}
