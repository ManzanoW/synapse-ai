import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AIResponse {
  text: string | null;
}

// Interface auxiliar para evitar o 'any'
interface RawMateria {
  nome?: string;
  materia?: string;
  name?: string;
  topicos?: string[];
  topics?: string[];
}

async function generateContentWithRetry(
  prompt: string,
  retries = 3,
): Promise<AIResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json" },
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
      Você é um especialista em análise de editais para concursos públicos e vestibulares.
      Sua tarefa é extrair e organizar todas as matérias e seus respectivos tópicos de estudo contidos no texto fornecido.

      TEXTO DO EDITAL:
      """
      ${cleanText}
      """

      INSTRUÇÃO IMPORTANTE:
      Extraia todas as disciplinas e tópicos do texto programático acima.

      REGRAS DE EXTRAÇÃO E FORMATAÇÃO DOS TÓPICOS:
      1. REMOVA NUMERAÇÕES: Remova qualquer índice numérico ou letras do início (ex: "1.1 Docker" vira "Docker", "7.1 Oracle" vira "Oracle").
      2. MANTENHA TÓPICOS CURTOS E DIRETOS: Não crie frases longas nem junte múltiplas tecnologias/linguagens na mesma linha. Cada tópico deve ter idealmente de 1 a 5 palavras.
         - Exemplo Ruim: "Linguagens de programação: Java, Python e Shell Script"
         - Exemplo Bom: Separar em tópicos individuais: "Java", "Python", "Shell Script"
      3. CONSOLIDE APENAS PRODUTOS/VERSÕES DA MESMA FERRAMENTA: Agrupe somente quando forem variações ou suítes do mesmo software para evitar redundância extrema.
         - Exemplo Ruim: "VMware NSX", "VMware vCenter", "VMware vCloud"
         - Exemplo Bom: "VMware Suite (NSX, vCenter, vCloud)"

      Retorne ESTRITAMENTE um objeto JSON válido no formato:
      {
        "materias": [
          {
            "nome": "Nome da Matéria",
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

    // Tratamento resiliente caso a IA mude as chaves da resposta
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

    // Helper com Regex para garantir 100% que nenhuma numeração passe despercebida
    const cleanTopicTitle = (title: string): string => {
      if (typeof title !== "string") return title;
      return title
        .replace(/^(\d+(\.\d+)*\s*[-–—.]?\s*)/, "") // Remove "1 ", "1.1 ", "1.1.2 - ", etc.
        .trim();
    };

    const normalizedMaterias = rawList.map((item: RawMateria) => {
      const topicosArray = Array.isArray(item.topicos)
        ? item.topicos
        : Array.isArray(item.topics)
          ? item.topics
          : [];

      return {
        nome: item.nome || item.materia || item.name || "Matéria sem nome",
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
