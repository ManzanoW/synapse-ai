import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AIResponse {
  text: string | null;
}

interface Alternativa {
  id: string;
  texto: string;
}

interface QuestaoGerada {
  enunciado: string;
  formato: string;
  justificativa: string;
  alternativas: Alternativa[];
  gabaritoCorreto: string;
  flashcardFrente: string;
  flashcardVerso: string;
}

/**
 * Embaralha as alternativas de questões de múltipla escolha para eliminar
 * vícios de posição do modelo de IA (ex: excesso de respostas na letra B)
 * e reatribui corretamente o gabarito.
 */
function shuffleAlternatives(questoes: QuestaoGerada[]): QuestaoGerada[] {
  return questoes.map((q) => {
    if (
      q.formato !== "multipla" ||
      !Array.isArray(q.alternativas) ||
      q.alternativas.length === 0
    ) {
      return q;
    }

    // Identifica o texto da opção que é o gabarito correto original
    const alternativaCorretaObj = q.alternativas.find(
      (alt) => alt.id === q.gabaritoCorreto,
    );
    const textoCorreto = alternativaCorretaObj
      ? alternativaCorretaObj.texto
      : null;

    // Se não encontrou o gabarito entre as opções, retorna sem alterar
    if (!textoCorreto) return q;

    // Algoritmo Fisher-Yates para embaralhar os textos das alternativas
    const textos = q.alternativas.map((a) => a.texto);
    for (let i = textos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [textos[i], textos[j]] = [textos[j], textos[i]];
    }

    // Mapeia novamente para as letras A, B, C, D...
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

async function generateContentWithRetry(
  prompt: string,
  retries = 2,
): Promise<AIResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3, // Leve aumento para maior variabilidade de distribuições
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questoes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    enunciado: { type: Type.STRING },
                    formato: { type: Type.STRING },
                    justificativa: { type: Type.STRING },
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
          },
        },
      });

      clearTimeout(timeoutId);
      return { text: result.text || "" };
    } catch (error: unknown) {
      const err = error as { status?: number };

      if (err.status === 503 && i < retries - 1) {
        await new Promise((res) => setTimeout(res, 1000));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Falha ao gerar conteúdo após múltiplas tentativas.");
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const {
      banca,
      materia,
      topicoId,
      topicoNome,
      qtdQuestoes,
      dificuldade,
      textoBase,
      fonteConteudo,
    } = await request.json();

    if (!banca || !materia || !qtdQuestoes) {
      return NextResponse.json(
        { error: "Parâmetros ausentes." },
        { status: 400 },
      );
    }

    const quantidade = parseInt(qtdQuestoes, 10) || 5;

    let promptContexto = "";

    const isAllTopics =
      !topicoId ||
      topicoId === "ALL" ||
      topicoNome === "Todos os Tópicos da Matéria";

    if (isAllTopics) {
      const subjectRecord = await prisma.subject.findFirst({
        where: { name: materia },
        include: { topics: true },
      });

      if (subjectRecord && subjectRecord.topics.length > 0) {
        const listaTopicos = subjectRecord.topics
          .map((t) => t.title)
          .join("; ");
        promptContexto += `Distribua as questões de forma equilibrada entre os seguintes tópicos da matéria "${materia}": [${listaTopicos}].\n`;
      } else {
        promptContexto += `Abranga de forma geral e ampla todo o conteúdo programático padrão da matéria "${materia}".\n`;
      }
    } else {
      promptContexto += `Atenção: Foque as questões estritamente no Tópico Específico: "${topicoNome}" pertencente à matéria "${materia}".\n`;
    }

    if (fonteConteudo === "texto" && textoBase) {
      promptContexto += `Obrigatório basear as questões estritamente neste texto/lei:\n"${textoBase}"\n`;
    }

    const prompt = `
      Você é um professor PhD e especialista elaborador de provas para bancas de concursos públicos de elite.
      Gere exatamente ${quantidade} questões inéditas para a matéria: "${materia}".
      Nível de Dificuldade: "${dificuldade}". 
      Estilo da Banca: "${banca}".
      
      ${promptContexto}
      
      ===================================================================
      🔥 FLUXO OBRIGATÓRIO DE ELABORAÇÃO PARA CADA QUESTÃO:
      ===================================================================
      1. CÁLCULO E FUNDAMENTAÇÃO PRÉVIA (FAÇA ISSO PRIMEIRO):
         - Antes de criar o enunciado final e as alternativas, defina a questão e RESOLVA-A por completo.
         - Se for EXATAS/CÁLCULO: Calcule com precisão matemática absoluta até encontrar o resultado numérico exato.
         - Se for DIREITO/TEORIA: Fundamente na legislação vigente, jurisprudência ou regra teórica correspondente.

      2. CRIAÇÃO DAS ALTERNATIVAS COM O VALOR EXATO:
         - Pegue o RESULTADO EXATO obtido no passo anterior e coloque-o em UMA das opções (A, B, C ou D).
         - Crie distratores plausíveis para as outras 3 alternativas.
         - É ESTRITAMENTE PROIBIDO criar alternativas em que o resultado exato obtido na justificativa não esteja presente.

      3. DISTRIBUIÇÃO RANDÔMICA E IMPARCIONAL DOS GABARITOS (CRÍTICO):
         - NUNCA fixe ou repita o mesmo gabarito (ex: opção "B") em várias questões seguidas.
         - Distribua as respostas corretas de forma aleatória e uniforme entre A, B, C e D ao longo do simulado.

      4. VALIDAÇÃO CRUZADA DE GABARITO (RIGOROSO):
         - Identifique explicitamente em qual LETRA ("A", "B", "C" ou "D") está o resultado exato calculado.
         - Atribua ESTREITAMENTE essa LETRA ao campo "gabaritoCorreto".
         - É estritamente proibida qualquer divergência entre a conclusão da justificativa e a letra do gabarito.

      ===================================================================
      DIRETRIZES DE DESTAQUE NO ENUNCIADO (USO DE NEGRITO):
      ===================================================================
      - Destaque em negrito (**termo**) os conceitos centrais e dados numéricos importantes.
      - PROIBIDO destacar a resposta final no enunciado.

      ===================================================================
      FORMATO DAS RESPOSTAS:
      ===================================================================
      - Se banca for "Cebraspe": formato "certo_errado" (gabaritoCorreto: "Certo" ou "Errado", alternativas: []).
      - Outras bancas: formato "multipla" com exatamente 4 alternativas (ids: "A", "B", "C", "D").
      - "gabaritoCorreto": deve conter APENAS a letra correspondente à opção correta ("A", "B", "C" ou "D") ou "Certo"/"Errado".
    
      Além da questão e das alternativas, gere uma versão em Flashcard (Active Recall) para cada item: no 'flashcardFrente', faça uma pergunta conceitual e direta sobre a matéria testada; no 'flashcardVerso', responda com o conceito direto de forma clara e sintética.    
      `;

    const response = await generateContentWithRetry(prompt);

    if (!response.text) {
      throw new Error("Nenhum conteúdo retornado pela IA.");
    }

    const data = JSON.parse(response.text);

    // Aplica o embaralhado de segurança das alternativas no backend
    const questoesProcessadas = shuffleAlternatives(data.questoes || []);

    // Persistência do Quiz no Banco vinculado ao Topic ID
    let savedQuiz = null;
    if (userId) {
      savedQuiz = await prisma.quiz.create({
        data: {
          userId,
          banca,
          subject: materia,
          difficulty: dificuldade,
          topicId: !isAllTopics ? topicoId : null,
          questions: questoesProcessadas as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json(
      {
        data: questoesProcessadas,
        quizId: savedQuiz?.id || null,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro Gemini:", error);

    return NextResponse.json(
      { error: "Falha interna.", details: errorMessage },
      { status: 500 },
    );
  }
}
