import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { PRESET_HEX_COLORS } from "@/constants/subjects"; // 1. Import da paleta de cores

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

interface AIResponse {
  text: string | null;
}

// 2. Interface atualizada com suporte a cor (HEX)
interface RawMateria {
  nome?: string;
  materia?: string;
  name?: string;
  cor?: string;
  color?: string;
  topicos?: string[];
  topics?: string[];
}

async function generateContentWithRetry(
  prompt: string,
  retries = 3,
): Promise<AIResponse> {
  const ai = getAIClient();
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // 🟢 SCHEMA RÍGIDO: Força o Gemini a preencher a cor obrigatoriamente
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              materias: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nome: { type: Type.STRING },
                    color: {
                      type: Type.STRING,
                      description:
                        "Hex da cor base do domínio: #3B82F6 (Dev/Arch), #10B981 (Test/QA), #8B5CF6 (Methodologies), #F59E0B (Frontend/UX), #EC4899 (Security)",
                    },
                    topicos: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["nome", "color", "topicos"],
                },
              },
            },
            required: ["materias"],
          },
        },
      });

      clearTimeout(timeoutId);
      return { text: result.text || "" };
    } catch (error: unknown) {
      const err = error as { status?: number };

      if ((err.status === 429 || err.status === 503) && i < retries - 1) {
        const waitTime = err.status === 429 ? 5000 : 1500;
        await new Promise((res) => setTimeout(res, waitTime));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Falha ao processar o edital após múltiplas tentativas.");
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "O texto do edital não foi fornecido." },
        { status: 400 },
      );
    }

    const cleanText = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .substring(0, 30000);

    const prompt = `
      Você é um especialista em organização de edital e técnicas de estudo.
      Sua tarefa é analisar o texto do edital e extrair as Matérias e Tópicos de forma SINTÉTICA e PRÁTICA para estudo.

      TEXTO DO EDITAL:
      """
      ${cleanText}
      """

      INSTRUÇÃO IMPORTANTE:
      Extraia todas as disciplinas e tópicos do texto programático acima.

      REGRAS RIGOROSAS DE AGRUPAMENTO:
      1. NÍVEL DE GRANULARIDADE (Evite super-atomição):
        - NÃO crie um tópico para cada tecnologia isolada ou frameworks.
        - AGRUPE linguagens e frameworks correlatos em um único tópico macro. 
        - Exemplo RUIM: Tópicos separados para "Java", "Spring", "Hibernate", "JPA".
        - Exemplo BOM: Tópico único chamado "Desenvolvimento Java (JavaEE, JPA, SpringBoot, Hibernate)".

      2. CRIAÇÃO DE MATÉRIAS E ATRIBUIÇÃO DE CORES (CAMPO 'cor'):
        - Se o texto contiver múltiplos blocos grandes de conhecimento (ex: Desenvolvimento, Testes, Engenharia de Requisitos, Frontend, UX), DIVIDA-OS em Matérias diferentes para não poluir uma única matéria.
        - Exemplo: 
          - Matéria 1: Desenvolvimento e Arquitetura de Software
          - Matéria 2: Testes de Software e RPA
          - Matéria 3: Metodologias Ágeis e Requisitos
          - Matéria 4: Frontend e UX/UI
        - Para CADA Matéria, atribua obrigatoriamente um código HEX do campo 'cor' baseando-se estritamente na categoria do conhecimento:
          * '#3B82F6' -> Exatas, Engenharia, Programação, Arquitetura de Software ou Banco de Dados.
          * '#10B981' -> Testes de Software, Qualidade, Governança, Legislação Específica ou Auditoria.
          * '#8B5CF6' -> Metodologias Ágeis, Engenharia de Requisitos, Gestão de Projetos ou Direitos.
          * '#F59E0B' -> Frontend, UX/UI, Português, Inglês ou Conhecimentos Gerais.
          * '#EC4899' -> Redes de Computadores, Infraestrutura, Segurança da Informação ou Cyber Security.

      3. TAMANHO IDEAL:
        - Tente manter entre 5 a 15 tópicos significativos por Matéria. Tópicos de estudo devem levar entre 1 a 3 horas para serem estudados/revisados, e não 5 minutos.

      Retorne ESTRITAMENTE um objeto JSON válido no formato:
      {
        "materias": [
          {
            "nome": "Nome da Matéria",
            "color": "#HEX_COR", // Deve ser uma das cores: #3B82F6 (Dev/Arch), #10B981 (Test/QA), #8B5CF6 (Methodologies), #F59E0B (Frontend/UX), #EC4899 (Security)
    "topics": [
            "topicos": [
              "Nome do Tópico 1",
              "Nome do Tópico 2"
            ]
          }
        ]
      }
    `;

    const response = await generateContentWithRetry(prompt);

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Nenhum conteúdo retornado pela IA.");
    }

    const cleanJson = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanJson);

    let rawList: RawMateria[] = [];
    if (Array.isArray(parsedData)) {
      rawList = parsedData;
    } else if (parsedData.materias) {
      rawList = parsedData.materias;
    } else if (parsedData.subjects) {
      rawList = parsedData.subjects;
    } else if (parsedData.disciplinas) {
      rawList = parsedData.disciplinas;
    }

    const cleanTopicTitle = (title: string): string => {
      if (typeof title !== "string") return title;
      return title.replace(/^(\d+(\.\d+)*\s*[-–—.]?\s*)/, "").trim();
    };

    const normalizedMaterias = rawList.map((item: RawMateria) => {
      const topicosArray = Array.isArray(item.topicos)
        ? item.topicos
        : Array.isArray(item.topics)
          ? item.topics
          : [];

      // Pega a cor que a IA enviou ou sorteia uma cor válida da nossa paleta como fallback resguardo
      const hexColor = item.cor || item.color;
      const validColor = PRESET_HEX_COLORS.includes(hexColor as string)
        ? hexColor
        : PRESET_HEX_COLORS[
            Math.floor(Math.random() * PRESET_HEX_COLORS.length)
          ];

      return {
        nome: item.nome || item.materia || item.name || "Matéria sem nome",
        cor: validColor, // 🟢 Retorna a cor tratada diretamente para o front/modal
        topicos: topicosArray.map((topico: string) => cleanTopicTitle(topico)),
      };
    });

    return NextResponse.json({ materias: normalizedMaterias }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro Gemini Parse Edital:", error);

    const isQuotaError =
      errorMessage.includes("429") || errorMessage.includes("quota");
    const userFriendlyMessage = isQuotaError
      ? "A cota gratuita de requisições foi atingida temporariamente. Por favor, aguarde alguns segundos e tente novamente."
      : "Falha ao analisar o edital.";

    return NextResponse.json(
      { error: userFriendlyMessage, details: errorMessage },
      { status: isQuotaError ? 429 : 500 },
    );
  }
}
