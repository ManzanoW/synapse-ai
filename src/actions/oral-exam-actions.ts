"use server";

import { auth } from "@/auth";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

export interface OralQuestionData {
  id: string;
  cargo: string;
  disciplina: string;
  ponto: string;
  enunciadoExaminador: string;
  contextoExaminador: string;
  tempoRecomendadoSegundos: number;
}

export interface OralEvaluationResult {
  notaGeral: number; // 0 a 10
  notaTecnica: number; // 0 a 10
  notaOratoria: number; // 0 a 10
  isApproved: boolean; // >= 6.0
  veredito: string;
  feedbackTecnico: string;
  feedbackOratoria: string;
  espelhoNota10: string;
  pontosFortes: string[];
  pontosMelhoria: string[];
  legislacaoCitadaEsperada: string[];
}

// Perguntas modelo de banca oral para fallback rápido e confiabilidade
const PRESET_ORAL_QUESTIONS: Record<string, OralQuestionData[]> = {
  DELEGADO: [
    {
      id: "oral-del-1",
      cargo: "Delegado de Polícia Civil / Federal",
      disciplina: "Direito Processual Penal",
      ponto: "Medidas Cautelares Pessoais e Prisão Preventiva",
      enunciadoExaminador:
        "Candidato, disserte minuciosamente sobre os pressupostos e requisitos para a decretação da prisão preventiva no ordenamento jurídico brasileiro. Esclareça, em especial, se é lícito ao magistrado decretar a prisão preventiva de ofício durante o inquérito policial ou na fase judicial, à luz do Pacote Anticrime e da jurisprudência consolidada do STF.",
      contextoExaminador:
        "Banca Examinadora de Polícia Judiciária - Sabatina Oral de Processo Penal",
      tempoRecomendadoSegundos: 180,
    },
    {
      id: "oral-del-2",
      cargo: "Delegado de Polícia Civil / Federal",
      disciplina: "Direito Penal",
      ponto: "Excludentes de Ilicitude e Legítima Defesa",
      enunciadoExaminador:
        "Candidato, diferencie estado de necessidade de legítima defesa quanto aos seus bens jurídicos e destinatários. Em seguida, responda: é admissível legítima defesa recíproca? E legítima defesa real contra legítima defesa putativa?",
      contextoExaminador:
        "Banca Examinadora de Polícia Judiciária - Sabatina Oral de Direito Penal",
      tempoRecomendadoSegundos: 180,
    },
  ],
  MAGISTRATURA: [
    {
      id: "oral-mag-1",
      cargo: "Juiz de Direito / Magistratura Estadual",
      disciplina: "Direito Constitucional",
      ponto: "Controle de Constitucionalidade e Modulação de Efeitos",
      enunciadoExaminador:
        "Candidato, explique a distinção entre a nulidade 'ab initio' e a técnica de modulação temporal dos efeitos da decisão no controle concentrado de constitucionalidade. Quais os requisitos formais e materiais exigidos pelo art. 27 da Lei 9.868/1999 para que o Supremo Tribunal Federal module tais efeitos?",
      contextoExaminador:
        "Banca Examinadora de Concurso para Ingresso na Magistratura de Carreira",
      tempoRecomendadoSegundos: 180,
    },
  ],
  MINISTERIO_PUBLICO: [
    {
      id: "oral-mp-1",
      cargo: "Promotor de Justiça / Ministério Público",
      disciplina: "Direito Administrativo & Tutela Coletiva",
      ponto: "Improbidade Administrativa e Acordo de Não Persecução Civil",
      enunciadoExaminador:
        "Candidato, com o advento da Lei nº 14.230/2021 que reformou a Lei de Improbidade Administrativa, ainda subsiste a modalidade culposa em qualquer hipótese? Ademais, discorra sobre a legitimidade e os requisitos para a celebração do Acordo de Não Persecução Civil (ANPC) pelo Ministério Público.",
      contextoExaminador:
        "Banca Examinadora do Ministério Público Estadual - Sabatina de Tutela Coletiva",
      tempoRecomendadoSegundos: 180,
    },
  ],
  AUDITOR_FISCAL: [
    {
      id: "oral-aud-1",
      cargo: "Auditor Fiscal da Receita Federal / Estadual",
      disciplina: "Direito Tributário",
      ponto: "Lançamento Tributário e Decadência",
      enunciadoExaminador:
        "Candidato, diferencie as modalidades de lançamento tributário previstas no Código Tributário Nacional. Explique as regras de contagem do prazo decadencial para a constituição do crédito tributário nos tributos sujeitos a lançamento por homologação, confrontando o art. 150, § 4º com o art. 173, I do CTN.",
      contextoExaminador:
        "Banca Examinadora da Carreira de Auditoria Fiscal",
      tempoRecomendadoSegundos: 180,
    },
  ],
};

/**
 * Gera ou sorteia uma questão de prova oral realista formulada por examinador de concurso
 */
export async function generateOralQuestionAction(input: {
  cargo: string;
  disciplina: string;
  ponto?: string;
}): Promise<{ success: boolean; data: OralQuestionData; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, data: PRESET_ORAL_QUESTIONS.DELEGADO[0], error: "Usuário não autenticado." };
    }

    // Se houver preset direto
    const key = input.cargo.toUpperCase().includes("DELEGADO")
      ? "DELEGADO"
      : input.cargo.toUpperCase().includes("MAGISTRATURA") || input.cargo.toUpperCase().includes("JUIZ")
      ? "MAGISTRATURA"
      : input.cargo.toUpperCase().includes("PROMOTOR") || input.cargo.toUpperCase().includes("MINISTÉRIO")
      ? "MINISTERIO_PUBLICO"
      : "DELEGADO";

    if (!input.ponto && PRESET_ORAL_QUESTIONS[key]) {
      const list = PRESET_ORAL_QUESTIONS[key];
      const randomItem = list[Math.floor(Math.random() * list.length)];
      return { success: true, data: randomItem };
    }

    // Geração dinâmica com IA
    const prompt = `Você é o Presidente de Banca Examinadora de Prova Oral de concurso público de alto nível no Brasil (Carreiras Jurídicas e Policiais).
O candidato está concorrendo ao cargo de: "${input.cargo}".
Disciplina da arguição: "${input.disciplina}".
Ponto ou tema: "${input.ponto || "Tópico central e controvertido do edital"}".

Formule uma questão de prova oral digna de banca examinadora real (formal, incisiva, articulada com tratamento cerimonioso 'Candidato(a)...').

Retorne EXCLUSIVAMENTE um objeto JSON estrito com esta estrutura:
{
  "cargo": "${input.cargo}",
  "disciplina": "${input.disciplina}",
  "ponto": "Tema do Ponto Sorteado",
  "enunciadoExaminador": "Candidato(a), [pergunta formal da banca examinadora com 2 a 3 desdobramentos técnicos e solicitação de precedentes ou artigos]",
  "contextoExaminador": "Banca Examinadora Oficial - Arguição Oral",
  "tempoRecomendadoSegundos": 180
}`;

    const res = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      preferredModels: ["gemini-2.5-flash", "gemini-3.7-flash"],
    });

    if (res?.text) {
      let clean = res.text.trim();
      if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(clean);
      return {
        success: true,
        data: {
          id: `oral-dyn-${Date.now()}`,
          cargo: parsed.cargo || input.cargo,
          disciplina: parsed.disciplina || input.disciplina,
          ponto: parsed.ponto || "Ponto Sorteado",
          enunciadoExaminador: parsed.enunciadoExaminador,
          contextoExaminador: parsed.contextoExaminador || "Banca Oficial",
          tempoRecomendadoSegundos: parsed.tempoRecomendadoSegundos || 180,
        },
      };
    }

    return { success: true, data: PRESET_ORAL_QUESTIONS.DELEGADO[0] };
  } catch (error) {
    console.error("[Generate Oral Question Error]:", error);
    return {
      success: true,
      data: PRESET_ORAL_QUESTIONS.DELEGADO[0],
    };
  }
}

/**
 * Avalia a resposta transcrita do candidato com rubrica pedagógica de prova oral
 */
export async function evaluateOralAnswerAction(input: {
  cargo: string;
  disciplina: string;
  questionText: string;
  candidateTranscript: string;
  durationSeconds: number;
}): Promise<{ success: boolean; data?: OralEvaluationResult; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;

    if (!input.candidateTranscript || input.candidateTranscript.trim().length < 10) {
      return {
        success: false,
        error: "Resposta muito curta ou inaudível. Fale com clareza ao microfone.",
      };
    }

    const prompt = `Você é um rigoroso e pedagógico Examinador de Prova Oral de concursos públicos de elite no Brasil.
Cargo em disputa: "${input.cargo}".
Disciplina: "${input.disciplina}".
Pergunta formulada pela banca: "${input.questionText}".
Tempo de resposta utilizado pelo candidato: ${input.durationSeconds} segundos.

Transcrição da fala do candidato:
"""${input.candidateTranscript}"""

Avalie a resposta segundo os critérios oficiais de bancas examinadoras (Cebraspe, FGV, Vunesp, MPE, TJ):
1. Domínio Técnico-Jurídico (0 a 10):
   - O candidato identificou os conceitos basilares?
   - Citou artigos de lei (CF, CP, CPP, Leis especiais) ou jurisprudência (STF/STJ)?
   - Demonstrou raciocínio lógico-jurídico e segurança dogmática?
2. Postura, Concisão e Oratória (0 a 10):
   - A resposta teve introdução, fundamentação e conclusão formal?
   - Usou vocabulário técnico adequado?
   - Evitou vícios de linguagem excessivos (né, tipo, tá)?
3. Média Geral (0 a 10) e Status de Aprovação (Aprovado se >= 6.0).
4. Espelho da Resposta Nota 10: Como um candidato de altíssimo gabarito responderia à arguição oral de forma elegante, precisa e irretocável.

Retorne EXCLUSIVAMENTE um objeto JSON estrito com esta estrutura:
{
  "notaGeral": 8.5,
  "notaTecnica": 8.5,
  "notaOratoria": 8.5,
  "isApproved": true,
  "veredito": "Candidato Aprovado com Louvor / Aprovado / Reprovado",
  "feedbackTecnico": "Detalhamento cirúrgico dos acertos conceituais e eventuais omissões normativas",
  "feedbackOratoria": "Análise da fluidez, clareza, concisão e segurança na comunicação oral",
  "espelhoNota10": "A resposta modelo que obteria nota 10,0 perante a banca",
  "pontosFortes": ["Ponto 1", "Ponto 2"],
  "pontosMelhoria": ["Ponto 1", "Ponto 2"],
  "legislacaoCitadaEsperada": ["Art. 312 do CPP", "Lei 13.964/19"]
}`;

    const res = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      preferredModels: [
        "gemini-2.5-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
      ],
    });

    if (!res?.text) {
      return { success: false, error: "A IA não conseguiu tabular a avaliação oral." };
    }

    let clean = res.text.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const evaluation = JSON.parse(clean) as OralEvaluationResult;

    // Registra atividade de gamificação (+100 XP por sabatina oral completa)
    await recordStudyActivityAction(
      userId,
      100,
      "QUIZ",
      Math.max(1, Math.ceil(input.durationSeconds / 60))
    ).catch(() => null);

    return {
      success: true,
      data: evaluation,
    };
  } catch (error) {
    console.error("[Evaluate Oral Answer Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao avaliar resposta oral.",
    };
  }
}
