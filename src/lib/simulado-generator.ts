import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { MentorGuidance } from "@/types/quiz";

export type { MentorGuidance };

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
  mentorGuidance?: MentorGuidance;
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
  adaptiveMode?: boolean;
  formatoQuestao?: "auto" | "certo_errado" | "multipla_4" | "multipla_5" | "casos_praticos";
  nivelCargo?: "medio" | "superior" | "juridico";
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

/**
 * Busca questões elegíveis já geradas anteriormente no banco de dados para a mesma banca e matéria/tópico.
 * Garante que:
 * 1. O aluno atual nunca veja questões que ele já respondeu/viu em quizzes anteriores.
 * 2. As questões tenham validação estrutural completa (enunciado, alternativas/gabarito, justificativa).
 * 3. O formato (Certo/Errado vs Múltipla Escolha) seja estritamente compatível.
 * 4. O limite respeite a proporção máxima de cache (até 40% do total) para garantir frescor da IA.
 */
async function fetchCachedQuestionsForSimulado(params: {
  banca: string;
  materia: string;
  targetTopicUuid?: string | null;
  dificuldade?: string;
  isCebraspeStyle: boolean;
  maxToReuse: number;
  userId?: string | null;
}): Promise<QuestaoGerada[]> {
  const {
    banca,
    materia,
    targetTopicUuid,
    dificuldade,
    isCebraspeStyle,
    maxToReuse,
    userId,
  } = params;

  if (maxToReuse <= 0) return [];

  try {
    const seenQuestionTexts = new Set<string>();

    if (userId) {
      const userQuizzes = await prisma.quiz.findMany({
        where: { userId },
        select: { questions: true },
        take: 30,
        orderBy: { createdAt: "desc" },
      });

      for (const qz of userQuizzes) {
        if (Array.isArray(qz.questions)) {
          for (const item of qz.questions as unknown as QuestaoGerada[]) {
            if (item?.enunciado) {
              seenQuestionTexts.add(item.enunciado.trim().toLowerCase());
            }
          }
        }
      }
    }

    const candidateQuizzes = await prisma.quiz.findMany({
      where: {
        banca: { equals: banca, mode: "insensitive" },
        ...(dificuldade ? { difficulty: { equals: dificuldade, mode: "insensitive" } } : {}),
        subject: { contains: materia, mode: "insensitive" },
        ...(targetTopicUuid ? { topicId: targetTopicUuid } : {}),
      },
      select: { questions: true },
      take: 25,
      orderBy: { createdAt: "desc" },
    });

    const pool: QuestaoGerada[] = [];

    for (const cq of candidateQuizzes) {
      if (!Array.isArray(cq.questions)) continue;

      for (const rawQ of cq.questions as unknown as QuestaoGerada[]) {
        if (
          !rawQ ||
          typeof rawQ.enunciado !== "string" ||
          !rawQ.enunciado.trim() ||
          typeof rawQ.gabaritoCorreto !== "string" ||
          typeof rawQ.justificativa !== "string"
        ) {
          continue;
        }

        // Validação estrita de compatibilidade de formato:
        if (isCebraspeStyle) {
          const isItemValid =
            rawQ.formato === "certo_errado" ||
            ["Certo", "Errado"].includes(rawQ.gabaritoCorreto.trim());
          if (!isItemValid) continue;
        } else {
          // Múltipla escolha
          const isItemValid =
            Array.isArray(rawQ.alternativas) && rawQ.alternativas.length >= 4;
          if (!isItemValid) continue;
        }

        const normalized = rawQ.enunciado.trim().toLowerCase();
        if (seenQuestionTexts.has(normalized)) continue;

        seenQuestionTexts.add(normalized);
        pool.push(rawQ);

        if (pool.length >= maxToReuse * 3) break;
      }

      if (pool.length >= maxToReuse * 3) break;
    }

    if (pool.length === 0) return [];

    return shuffleArray(pool).slice(0, maxToReuse);
  } catch (error) {
    console.warn("[simulado-generator] Erro não-bloqueante no cache híbrido:", error);
    return [];
  }
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
          mentorGuidance: {
            type: Type.OBJECT,
            description:
              "Orientação pedagógica estruturada do Copilot Mentor IA (Socrático, Lei Seca Descomplicada, Mnemônico e Pegadinha).",
            properties: {
              socraticHint: {
                type: Type.STRING,
                description:
                  "Dica socrática cirúrgica guiando a linha de raciocínio do aluno SEM dar o gabarito de bandeja.",
              },
              simplifiedLaw: {
                type: Type.STRING,
                description:
                  "Tradução da lei seca ou conceito técnico denso em linguagem simples e analogia do cotidiano.",
              },
              mnemonic: {
                type: Type.STRING,
                description:
                  "Mnemônico, acrônimo ou rima marcante para fixar regras, prazos ou competências.",
              },
              trapWarning: {
                type: Type.STRING,
                description:
                  "Alerta da pegadinha clássica da banca e atenção aos distratores traiçoeiros.",
              },
            },
            required: [
              "socraticHint",
              "simplifiedLaw",
              "mnemonic",
              "trapWarning",
            ],
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
          "mentorGuidance",
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
    formatoQuestao = "auto",
    nivelCargo = "superior",
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

  // Coleta de histórico do Caderno de Erros para Modo Adaptativo
  let adaptiveContext = "";
  if (params.adaptiveMode && userId) {
    try {
      const userErrors = await prisma.questionError.findMany({
        where: {
          userId,
          status: "PENDING",
          ...(materia
            ? {
                OR: [
                  { subject: { name: { equals: materia, mode: "insensitive" } } },
                  { questionText: { contains: materia, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          questionText: true,
          errorReason: true,
          topic: { select: { title: true } },
        },
      });

      if (userErrors.length > 0) {
        const errorSummaries = userErrors
          .map((e, idx) => {
            const reasonLabel = e.errorReason || "Não classificado";
            const snippet = e.questionText.slice(0, 130).replace(/\s+/g, " ");
            const topicInfo = e.topic?.title ? ` [Tópico: ${e.topic.title}]` : "";
            return `${idx + 1}. Questão que o aluno errou: "${snippet}..." (Diagnóstico: ${reasonLabel})${topicInfo}`;
          })
          .join("\n");

        adaptiveContext = `
===================================================================
🎯 MODO ADAPTATIVO ATIVADO (SUPERACÃO DAS FRAQUEZAS DO ESTUDANTE):
===================================================================
O estudante possui erros pendentes nesta matéria no Caderno de Erros:
${errorSummaries}

DIRETRIZ PEDAGÓGICA OBRIGATÓRIA:
- Crie questões INÉDITAS que cobrem esses mesmos conceitos e pegadinhas onde o aluno falhou acima.
- Se houver pegadinha ou confusão de leitura (TRICK_QUESTION ou INTERPRETATION), calibre distratores realistas da banca "${banca}" e esclareça a distinção exata na justificativa.
- O objetivo central é desarmar as dúvidas recorrentes do estudante e consolidar o aprendizado definitivo.
===================================================================
`;
      }
    } catch (err) {
      console.error("[generateSimuladoInParallel] Erro ao buscar contexto adaptativo:", err);
    }
  }

  // Calibração do formato da questão
  const isCebraspeStyle =
    formatoQuestao === "certo_errado" ||
    (formatoQuestao === "auto" && banca.toLowerCase().includes("cebraspe"));

  const isCasosPraticos =
    formatoQuestao === "casos_praticos" ||
    (formatoQuestao === "auto" && banca.toLowerCase().includes("fgv"));

  const use5Alternatives =
    formatoQuestao === "multipla_5" ||
    (!isCebraspeStyle &&
      (banca.toLowerCase().includes("fcc") ||
        banca.toLowerCase().includes("fgv") ||
        banca.toLowerCase().includes("cesgranrio") ||
        banca.toLowerCase().includes("vunesp") ||
        banca.toLowerCase().includes("aocp") ||
        banca.toLowerCase().includes("idecan")));

  // ⚡ Estratégia de Cache Híbrido:
  // Se for simulado padrão (não adaptativo, sem texto/lei avulsa e sem recorte restrito),
  // reaproveitamos até 40% de questões inéditas para o aluno direto do banco, acelerando a resposta e economizando tokens da IA.
  const isEligibleForCache =
    !params.adaptiveMode &&
    !params.textoBase &&
    fonteConteudo !== "texto" &&
    !specificTopic?.trim();

  let cachedQuestions: QuestaoGerada[] = [];
  if (isEligibleForCache) {
    const maxToReuse = Math.floor(quantidadeTotal * 0.4);
    if (maxToReuse > 0) {
      cachedQuestions = await fetchCachedQuestionsForSimulado({
        banca,
        materia,
        targetTopicUuid,
        dificuldade,
        isCebraspeStyle,
        maxToReuse,
        userId,
      });
    }
  }

  const quantidadeParaGerarNaIA = Math.max(0, quantidadeTotal - cachedQuestions.length);

  // Divisão em lotes paralelos (chunks de no máximo 5) para a quantidade restante
  const batches = quantidadeParaGerarNaIA > 0
    ? calculateBatchSizes(quantidadeParaGerarNaIA, 5)
    : [];

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

    // Diretriz pedagógica da banca
    let bancaProfileDirective = "";
    const lowerBanca = banca.toLowerCase();
    if (lowerBanca.includes("cesgranrio")) {
      bancaProfileDirective = `
        - ESTILO CESGRANRIO (CNU / Caixa / BB / Petrobras): Enunciados contextualizados com desafios reais de políticas públicas, gestão ética, inclusão e atendimento cidadão. Alternativas homogêneas e bem elaboradas, sem pegadinhas de mera decoreba mecânica.
      `;
    } else if (lowerBanca.includes("fgv") || isCasosPraticos) {
      bancaProfileDirective = `
        - ESTILO FGV (Casos Práticos Hipotéticos): Enunciados com situações concretas ('João, servidor público estável...', 'Determinada sociedade empresária...'), exigindo do aluno aplicação da regra a fatos, interpretação sistemática e julgados dos tribunais.
      `;
    } else if (lowerBanca.includes("fcc")) {
      bancaProfileDirective = `
        - ESTILO FCC: Redação técnica primorosa, literalidade de dispositivos de lei e súmulas consolidadas do STF e STJ, com 5 alternativas bem estruturadas.
      `;
    } else if (lowerBanca.includes("cebraspe")) {
      bancaProfileDirective = `
        - ESTILO CEBRASPE / UNB: Itens assertivos e categóricos, testando conceitos profundos, com distratores sutis baseados em termos restritivos ('apenas', 'sempre', 'salvo') e jurisprudência pacificada.
      `;
    } else if (lowerBanca.includes("quadrix")) {
      bancaProfileDirective = `
        - ESTILO INSTITUTO QUADRIX: Foco estrito na letra da lei, resoluções e normativas administrativas de conselhos profissionais federais/regionais.
      `;
    } else if (lowerBanca.includes("aocp")) {
      bancaProfileDirective = `
        - ESTILO INSTITUTO AOCP: Enunciados diretos, foco na literalidade de leis penais, processuais e constitucionais, com atenção a prazos legais e súmulas vinculantes.
      `;
    } else if (lowerBanca.includes("idecan")) {
      bancaProfileDirective = `
        - ESTILO IDECAN: Questões com densidade analítica, situações de segurança pública e carreiras administrativas, doutrina consolidada e súmulas.
      `;
    } else if (lowerBanca.includes("vunesp")) {
      bancaProfileDirective = `
        - ESTILO VUNESP: Apego à letra da lei ('lei seca'), precisão terminológica e 5 alternativas objetivas.
      `;
    }

    // Diretriz do nível do cargo
    let careerLevelDirective = "";
    if (nivelCargo === "medio") {
      careerLevelDirective = `
        - PÚBLICO-ALVO: NÍVEL MÉDIO / TÉCNICO. Foque na letra da lei seca, conceitos basilares e regras gerais claras, evitando controvérsias doutrinárias excessivamente obscuras.
      `;
    } else if (nivelCargo === "juridico") {
      careerLevelDirective = `
        - PÚBLICO-ALVO: CARREIRAS JURÍDICAS & POLICIAIS (Delegado, Juiz, Promotor, Defensor, Perito). Exija profundidade técnica máxima, Informativos recentes do STF e STJ, súmulas vinculantes, teses de repercussão geral e distinções dogmáticas refinadas.
      `;
    } else {
      careerLevelDirective = `
        - PÚBLICO-ALVO: NÍVEL SUPERIOR / ANALISTA. Equilíbrio entre texto da lei, jurisprudência dominante e doutrina majoritária.
      `;
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
      Banca Organizadora: "${banca}".
      ${careerLevelDirective}
      ${bancaProfileDirective}
      
      ${batchContext}
      ${adaptiveContext}
      
      ===================================================================
      🔥 FLUXO OBRIGATÓRIO DE ELABORAÇÃO PARA CADA QUESTÃO:
      ===================================================================
      1. CÁLCULO E FUNDAMENTAÇÃO PRÉVIA:
         - Antes de criar o enunciado final e as alternativas, defina a questão e RESOLVA-A por completo.
         - Se for EXATAS/CÁLCULO: Calcule com precisão matemática absoluta até encontrar o resultado numérico exato.
         - Se for DIREITO/TEORIA: Fundamente na legislação vigente, jurisprudência dominante ou regras teóricas consolidadas.

      2. CRIAÇÃO DAS ALTERNATIVAS COM O VALOR EXATO:
         ${
           isCebraspeStyle
             ? '- Para formato Certo/Errado: elabore um item assertivo e defina se é "Certo" ou "Errado" com fundamentação sólida.'
             : use5Alternatives
               ? '- Crie exatamente 5 alternativas (A, B, C, D, E) com o gabarito exato em uma delas e distratores plausíveis nas demais.'
               : '- Crie exatamente 4 alternativas (A, B, C, D) com o gabarito exato em uma delas e distratores plausíveis nas demais.'
         }
         - É ESTRITAMENTE PROIBIDO criar alternativas em que o resultado exato calculado na justificativa não esteja presente.

      3. DISTRIBUIÇÃO RANDÔMICA E IMPARCIAL DOS GABARITOS:
         - NUNCA fixe ou repita o mesmo gabarito em várias questões seguidas.
         - Distribua as respostas corretas de forma aleatória e equilibrada.

      4. VALIDAÇÃO CRUZADA DE GABARITO (RIGOROSO):
         - Identifique explicitamente em qual LETRA está o resultado exato calculado.
         - Atribua ESTREITAMENTE essa LETRA ao campo "gabaritoCorreto".

      ===================================================================
      ⚡ REGRAS DE CONCISÃO E ALTA VELOCIDADE (MÁXIMO THROUGHPUT):
      ===================================================================
      - Enunciado: Seja conciso, claro e direto ao ponto, evitando textos desnecessariamente prolixos.
      - explanation / justificativa: texto explicativo conciso (max 2 frases objetivas demonstrando a regra ou o cálculo).
      - Flashcards: Pergunta no 'flashcardFrente' e resposta no 'flashcardVerso' com no máximo 1 frase concisa cada.

      ===================================================================
      FORMATO DAS RESPOSTAS:
      ===================================================================
      ${
        isCebraspeStyle
          ? '- formato "certo_errado" (gabaritoCorreto: "Certo" ou "Errado", alternativas: []).'
          : use5Alternatives
            ? '- formato "multipla" com exatamente 5 alternativas (ids: "A", "B", "C", "D", "E"). gabaritoCorreto deve ser uma letra entre "A" e "E".'
            : '- formato "multipla" com exatamente 4 alternativas (ids: "A", "B", "C", "D"). gabaritoCorreto deve ser uma letra entre "A" e "D".'
      }
    
      Além da questão e das alternativas, gere uma versão em Flashcard (Active Recall) para cada item: no 'flashcardFrente', elabore uma pergunta conceitual e direta sobre o cerne do tema; no 'flashcardVerso', responda com a definição/regra essencial de forma clara e sintética.

      ===================================================================
      🧠 COPILOT MENTOR IA (ORIENTAÇÃO PEDAGÓGICA INTEGRADA):
      ===================================================================
      Para cada questão, elabore cuidadosamente o objeto 'mentorGuidance':
      1. socraticHint: Dica socrática cirúrgica (1 a 2 frases) que estimula o raciocínio do candidato SEM entregar a resposta ou gabarito (ex: "Repare no conectivo ou na palavra restritiva no trecho...", "Lembre-se do princípio fundamental que diferencia atos vinculados de discricionários...").
      2. simplifiedLaw: Explicação clara em português simples, descomplicando termos jurídicos/técnicos pesados com uma analogia do cotidiano fácil de visualizar.
      3. mnemonic: Bizú, acrônimo, rima ou trocadilho memorável para fixar a regra, prazo ou lista sem esforço (ex: LIMPE, SOCIDIVAPU, etc.).
      4. trapWarning: Onde e como a banca costuma armar a pegadinha clássica neste tema para derrubar candidatos desatentos.
    `;

    try {
      const response = await generateContentWithFallback({
        prompt: batchPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 4096,
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

  // Execução 100% paralela com Promise.all (apenas se houver lotes pendentes para a IA)
  const results = batches.length > 0 ? await Promise.all(batchPromises) : [];

  // Consolidação dos arrays resultantes (iniciando com as questões do cache)
  const allRawQuestions: QuestaoGerada[] = [...cachedQuestions];
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

  if (cachedQuestions.length > 0) {
    const aiCount = allRawQuestions.length - cachedQuestions.length;
    const economyPct = Math.round((cachedQuestions.length / Math.max(allRawQuestions.length, 1)) * 100);
    console.log(
      `[simulado-generator] 🚀 Cache Híbrido ativado: ${cachedQuestions.length} questões do banco + ${aiCount} geradas via IA. Economia de ~${economyPct}% de tokens/cota.`
    );
  }

  // Se gerou a mais ou a menos devido à variação de cada lote, ajusta para a quantidade pedida
  const slicedQuestions = allRawQuestions.slice(0, quantidadeTotal);

  // Processa alternativas e embaralha a lista final para intercalar perfeitamente as do cache com as da IA
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

    const isAdaptive = Boolean(params.adaptiveMode);
    const finalSubject = specificTopic?.trim()
      ? (materia.toLowerCase().startsWith("simulado")
          ? `${materia} - ${specificTopic.trim()}`
          : `Simulado: ${materia} - ${specificTopic.trim()}`)
      : isAdaptive
        ? (materia.toLowerCase().startsWith("simulado")
            ? `${materia} [Adaptativo]`
            : `Simulado Adaptativo: ${materia}`)
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
