import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateContentWithFallback } from "@/lib/gemini-fallback";

export interface Alternativa {
  id: string;
  texto: string;
}

export interface QuestaoGerada {
  id?: string;
  enunciado: string;
  formato: string;
  justificativa: string;
  pegadinhaBanca?: string;
  explicacaoErro?: string;
  alternativas: Alternativa[];
  gabaritoCorreto: string;
  flashcardFrente: string;
  flashcardVerso: string;
  subjectId?: string;
  topicId?: string;
}

export interface GenerateSimuladoParams {
  banca: string;
  materia: string;
  topicoId?: string | null;
  topicoNome?: string | null;
  specificTopic?: string | null;
  qtdQuestoes: number | string;
  dificuldade?: string;
  textoBase?: string | null;
  fonteConteudo?: "banca" | "texto" | "pdf" | string;
}

export interface GenerateSimuladoResult {
  success: boolean;
  data: QuestaoGerada[];
  quizId: string | null;
  sessionId: string | null;
  usedModel?: string;
  durationMs?: number;
}

export function shuffleAlternatives(questoes: QuestaoGerada[]): QuestaoGerada[] {
  return questoes.map((q) => {
    if (
      q.formato !== "multipla" ||
      !Array.isArray(q.alternativas) ||
      q.alternativas.length === 0
    ) {
      return q;
    }

    const alternativaCorretaObj = q.alternativas.find(
      (alt) => alt.id === q.gabaritoCorreto,
    );
    const textoCorreto = alternativaCorretaObj
      ? alternativaCorretaObj.texto
      : null;

    if (!textoCorreto) return q;

    const textos = q.alternativas.map((a) => a.texto);
    for (let i = textos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [textos[i], textos[j]] = [textos[j], textos[i]];
    }

    const letras = ["A", "B", "C", "D", "E"];
    let novoGabarito = q.gabaritoCorreto;

    const novasAlternativas = textos.map((texto, index) => {
      const letra = letras[index] || `ALT_${index}`;
      if (texto === textoCorreto) {
        novoGabarito = letra;
      }
      return { id: letra, texto };
    });

    return {
      ...q,
      alternativas: novasAlternativas,
      gabaritoCorreto: novoGabarito,
    };
  });
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calcula a divisão em lotes para execução paralela.
 * Por exemplo: 20 questões -> [5, 5, 5, 5] (4 lotes de 5).
 * 15 questões -> [5, 5, 5]
 * 10 questões -> [5, 5]
 * 5 questões -> [5]
 */
export function calculateBatchSizes(total: number, maxBatchSize = 5): number[] {
  const boundedTotal = Math.min(Math.max(total, 1), 30);
  const batches: number[] = [];
  let remaining = boundedTotal;

  while (remaining > 0) {
    const size = Math.min(remaining, maxBatchSize);
    batches.push(size);
    remaining -= size;
  }

  return batches;
}

const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    questoes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          enunciado: {
            type: Type.STRING,
            description: "Enunciado claro, conciso e direto ao ponto.",
          },
          formato: { type: Type.STRING },
          justificativa: {
            type: Type.STRING,
            description: "Texto explicativo conciso (max 2 frases).",
          },
          pegadinhaBanca: { type: Type.STRING },
          explicacaoErro: { type: Type.STRING },
          alternativas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                texto: { type: Type.STRING },
              },
              required: ["id", "texto"],
            },
          },
          gabaritoCorreto: { type: Type.STRING },
          flashcardFrente: {
            type: Type.STRING,
            description:
              "Pergunta direta, conceitual e objetiva extraída do tema da questão, ideal para revisão por repetição espaçada.",
          },
          flashcardVerso: {
            type: Type.STRING,
            description:
              "Resposta direta e sucinta com a explicação teórica essencial.",
          },
        },
        required: [
          "enunciado",
          "formato",
          "justificativa",
          "alternativas",
          "gabaritoCorreto",
          "flashcardFrente",
          "flashcardVerso",
        ],
      },
    },
  },
  required: ["questoes"],
};

export async function generateSimuladoInParallel(
  params: GenerateSimuladoParams,
  userId?: string | null,
): Promise<GenerateSimuladoResult> {
  const startTime = Date.now();
  const {
    banca,
    materia,
    topicoId,
    topicoNome,
    specificTopic,
    qtdQuestoes,
    dificuldade = "Média",
    textoBase,
    fonteConteudo = "banca",
  } = params;

  if (!banca || !materia) {
    throw new Error("Banca e matéria são obrigatórios.");
  }

  const quantidadeTotal = Math.min(
    Math.max(parseInt(String(qtdQuestoes), 10) || 5, 1),
    30,
  );

  const isAllTopics =
    !topicoId ||
    topicoId === "ALL" ||
    topicoNome === "Todos os Tópicos da Matéria";

  let targetTopicUuid: string | null = null;
  let allSubjectTopics: { id: string; title: string }[] = [];

  if (!isAllTopics) {
    const dbTopic = await prisma.topic.findFirst({
      where: {
        OR: [{ id: topicoId || undefined }, { title: topicoNome || topicoId || undefined }],
        subject: {
          name: { equals: materia, mode: "insensitive" },
          ...(userId ? { userId } : {}),
        },
      },
      select: { id: true, title: true },
    });

    if (dbTopic) {
      targetTopicUuid = dbTopic.id;
    }
  } else {
    const subjectRecord = await prisma.subject.findFirst({
      where: { name: materia, ...(userId ? { userId } : {}) },
      include: { topics: { select: { id: true, title: true } } },
    });

    if (subjectRecord && subjectRecord.topics.length > 0) {
      allSubjectTopics = subjectRecord.topics;
    }
  }

  // Divisão em lotes paralelos (chunks de no máximo 5)
  const batches = calculateBatchSizes(quantidadeTotal, 5);

  // Mapeia cada lote com instrução focada e particionamento de tópicos
  const batchPromises = batches.map(async (batchCount, batchIndex) => {
    let batchContext = "";

    if (specificTopic?.trim()) {
      batchContext += `REQUISITO OBRIGATÓRIO DE ESCOPO: Todas as questões deste simulado DEVEM focar estritamente no seguinte recorte temático ou dispositivo legal: "${specificTopic.trim()}". Não gere questões genéricas fora desse assunto.\n`;
    }

    if (!isAllTopics) {
      const topicLabel = topicoNome || topicoId || "Geral";
      batchContext += `Atenção: Foque as questões estritamente no Tópico Específico: "${topicLabel}" pertencente à matéria "${materia}".\n`;
      batchContext += `Lote ${batchIndex + 1} de ${batches.length}: crie questões com nuances e abordagens conceituais variadas dentro deste tema.\n`;
    } else if (allSubjectTopics.length > 0) {
      // Particiona tópicos de forma balanceada entre os lotes
      const topicsPerBatch = Math.max(
        1,
        Math.ceil(allSubjectTopics.length / batches.length),
      );
      const startIdx = (batchIndex * topicsPerBatch) % allSubjectTopics.length;
      const batchTopicSlice = allSubjectTopics.slice(
        startIdx,
        startIdx + topicsPerBatch,
      );
      const topicList = (batchTopicSlice.length > 0 ? batchTopicSlice : allSubjectTopics)
        .map((t) => t.title)
        .join("; ");
      batchContext += `Priorize e distribua as questões deste lote entre os seguintes tópicos da matéria "${materia}": [${topicList}].\n`;
    } else {
      batchContext += `Abranga o conteúdo programático padrão da matéria "${materia}" sob a ótica da banca "${banca}". Lote ${batchIndex + 1}.\n`;
    }

    if (fonteConteudo === "texto" && textoBase) {
      batchContext += `Obrigatório basear as questões estritamente neste texto/lei:\n"${textoBase}"\n`;
    }

    const batchPrompt = `
      Você é um professor PhD e especialista elaborador de provas para a banca "${banca}".
      ATENÇÃO CRÍTICA: Você DEVE gerar EXATAMENTE ${batchCount} questões distintas e completas dentro do array 'questoes'. Não gere menos que ${batchCount} itens.
      
      Matéria: "${materia}".
      ${
        specificTopic?.trim()
          ? `REQUISITO OBRIGATÓRIO DE ESCOPO: Todas as questões deste simulado DEVEM focar estritamente no seguinte recorte temático ou dispositivo legal: "${specificTopic.trim()}". Não gere questões genéricas fora desse assunto.\n`
          : ""
      }Nível de Dificuldade: "${dificuldade}". 
      Estilo da Banca: "${banca}".
      
      ${batchContext}
      
      ===================================================================
      🔥 FLUXO OBRIGATÓRIO DE ELABORAÇÃO PARA CADA QUESTÃO:
      ===================================================================
      1. CÁLCULO E FUNDAMENTAÇÃO PRÉVIA:
         - Antes de criar o enunciado final e as alternativas, defina a questão e RESOLVA-A por completo.
         - Se for EXATAS/CÁLCULO: Calcule com precisão matemática absoluta até encontrar o resultado numérico exato.
         - Se for DIREITO/TEORIA: Fundamente na legislação vigente, jurisprudência dominante ou regras teóricas consolidadas.

      2. CRIAÇÃO DAS ALTERNATIVAS COM O VALOR EXATO:
         - Pegue o RESULTADO EXATO obtido e coloque-o em UMA das opções (A, B, C ou D).
         - Crie distratores plausíveis para as outras opções sem ambiguidades.
         - É ESTRITAMENTE PROIBIDO criar alternativas em que o resultado exato calculado na justificativa não esteja presente.

      3. DISTRIBUIÇÃO RANDÔMICA E IMPARCIAL DOS GABARITOS:
         - NUNCA fixe ou repita o mesmo gabarito em várias questões seguidas.
         - Distribua as respostas corretas de forma aleatória e equilibrada.

      4. VALIDAÇÃO CRUZADA DE GABARITO (RIGOROSO):
         - Identifique explicitamente em qual LETRA ("A", "B", "C" ou "D") está o resultado exato calculado.
         - Atribua ESTREITAMENTE essa LETRA ao campo "gabaritoCorreto".

      ===================================================================
      ⚡ REGRAS DE CONCISÃO E ALTA VELOCIDADE (MÁXIMO THROUGHPUT):
      ===================================================================
      - Enunciado: Seja conciso, claro e direto ao ponto, evitando textos longos ou prolixos.
      - explanation / justificativa: texto explicativo conciso (max 2 frases objetivas demonstrando a regra ou o cálculo).
      - Flashcards: Pergunta no 'flashcardFrente' e resposta no 'flashcardVerso' com no máximo 1 frase concisa cada.
      - Elimine explicações desnecessárias para garantir resposta rápida em lote.

      ===================================================================
      FORMATO DAS RESPOSTAS:
      ===================================================================
      - Se banca for "Cebraspe": formato "certo_errado" (gabaritoCorreto: "Certo" ou "Errado", alternativas: []).
      - Outras bancas: formato "multipla" com exatamente 4 alternativas (ids: "A", "B", "C", "D").
      - "gabaritoCorreto": deve conter APENAS a letra correspondente à opção correta ("A", "B", "C" ou "D") ou "Certo"/"Errado".
    
      Além da questão e das alternativas, gere uma versão em Flashcard (Active Recall) para cada item: no 'flashcardFrente', elabore uma pergunta conceitual e direta sobre o cerne do tema; no 'flashcardVerso', responda com a definição/regra essencial de forma clara e sintética.
    `;

    try {
      const response = await generateContentWithFallback({
        prompt: batchPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseSchema: geminiResponseSchema,
        },
        timeoutMs: 30000,
      });

      let text = response.text?.trim() || "";
      if (text.startsWith("```json")) text = text.replace(/^```json/, "").replace(/```$/, "").trim();
      if (text.startsWith("```")) text = text.replace(/^```/, "").replace(/```$/, "").trim();

      try {
        const parsed = JSON.parse(text);
        const batchQuestions: QuestaoGerada[] = Array.isArray(parsed.questoes)
          ? parsed.questoes
          : [];
        return {
          questions: batchQuestions,
          usedModel: response.usedModel,
        };
      } catch (parseError) {
        console.error(
          `Erro ao analisar JSON do lote ${batchIndex}:`,
          parseError,
          "\nTexto bruto recebido:\n",
          text,
        );
        return {
          questions: [],
          usedModel: response.usedModel,
        };
      }
    } catch (batchError) {
      console.error(`Erro ao gerar questões para o lote ${batchIndex}:`, batchError);
      return {
        questions: [],
        usedModel: undefined,
      };
    }
  });

  // Execução 100% paralela com Promise.all
  const results = await Promise.all(batchPromises);

  // Consolidação dos arrays resultantes
  const allRawQuestions: QuestaoGerada[] = [];
  let dominantModel = "gemini-3.5-flash-lite";

  results.forEach((r) => {
    if (r.usedModel) dominantModel = r.usedModel;
    if (Array.isArray(r.questions)) {
      allRawQuestions.push(...r.questions);
    }
  });

  if (allRawQuestions.length === 0) {
    throw new Error("A IA não retornou nenhuma questão válida.");
  }

  // Se gerou a mais ou a menos devido à variação de cada lote, ajusta para a quantidade pedida
  const slicedQuestions = allRawQuestions.slice(0, quantidadeTotal);

  // Processa alternativas e embaralha a lista final para intercalar os lotes
  const questoesProcessadas = shuffleArray(shuffleAlternatives(slicedQuestions));

  // Persistência no Banco de Dados
  let savedQuiz = null;
  if (userId) {
    if (targetTopicUuid) {
      const topicExists = await prisma.topic.findUnique({
        where: { id: targetTopicUuid },
      });
      if (!topicExists) targetTopicUuid = null;
    }

    const finalSubject = specificTopic?.trim()
      ? (materia.toLowerCase().startsWith("simulado")
          ? `${materia} - ${specificTopic.trim()}`
          : `Simulado: ${materia} - ${specificTopic.trim()}`)
      : materia;

    savedQuiz = await prisma.quiz.create({
      data: {
        userId,
        banca,
        subject: finalSubject,
        difficulty: dificuldade,
        topicId: targetTopicUuid,
        questions: questoesProcessadas as unknown as Prisma.InputJsonValue,
      },
      include: {
        topic: {
          select: { id: true, title: true },
        },
      },
    });

    if (targetTopicUuid) {
      await prisma.quizAttempt
        .create({
          data: {
            userId,
            topicId: targetTopicUuid,
            totalCount: questoesProcessadas.length,
            correctCount: 0,
          },
        })
        .catch((e) => console.error("Aviso ao registrar QuizAttempt:", e));
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    data: questoesProcessadas,
    quizId: savedQuiz?.id || null,
    sessionId: savedQuiz?.id || null,
    usedModel: dominantModel,
    durationMs,
  };
}
