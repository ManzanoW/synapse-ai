import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AIResponse {
  text: string | null;
}

// Extrai a chamada da IA para uma função com retry
async function generateContentWithRetry(
  prompt: string,
  retries = 2,
): Promise<AIResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      // Ajuste para evitar timeout excessivo
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos limite

      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      clearTimeout(timeoutId);
      // Retorna o resultado se a chamada for bem-sucedida
      return { text: result.text || "" };
    } catch (error: unknown) {
      const err = error as { status?: number };

      // Se for erro 503 e ainda tivermos tentativas, aguarda
      if (err.status === 503 && i < retries - 1) {
        await new Promise((res) => setTimeout(res, 1000)); // Espera curta
        continue;
      }

      // Se chegamos aqui, ou não é 503 ou acabaram as tentativas: relança o erro
      throw error;
    }
  }

  // Garantia final: o TypeScript precisa saber que algo será retornado
  throw new Error("Falha ao gerar conteúdo após múltiplas tentativas.");
}

export async function POST(request: Request) {
  try {
    const {
      banca,
      materia,
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
    if (fonteConteudo === "texto" && textoBase) {
      promptContexto = `Obrigatório basear as questões estritamente neste texto/lei:\n"${textoBase}"\n`;
    }

    const prompt = `
      Você é um professor de concursos. Gere um simulado inédito com exatamente ${quantidade} questões sobre: "${materia}".
      Dificuldade: "${dificuldade}". Banca: "${banca}".
      
      ${promptContexto}
      
      Diretrizes Críticas de Enunciado:
      - Se o enunciado mencionar um termo, palavra, oração ou trecho "destacado", "sublinhado" ou "em foco", você DEVE OBRIGATORIAMENTE incluir esse termo no enunciado e destacá-lo explicitamente usando ASPAS DUPLAS ou CAIXA ALTA (ex: ...na palavra "EXCEÇÃO", qual o...). Nunca deixe o comando sem a palavra correspondente.
      
      Diretrizes de Formato:
      - Se a banca for "Cebraspe": formato "certo_errado" (gabarito: "Certo" ou "Errado", alternativas vazias).
      - Se outra banca: formato "multipla" com 4 alternativas (A, B, C, D).

      Retorne ESTRITAMENTE um objeto JSON válido, sem explicações adicionais, no seguinte formato:
      {
        "questoes": [
          {
            "enunciado": "Texto da questão...",
            "formato": "multipla ou certo_errado",
            "alternativas": [{"id": "A", "texto": "Opção A..."}, {"id": "B", "texto": "Opção B..."}],
            "gabaritoCorreto": "Alternativa certa",
            "justificativa": "Explicação teórica..."
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
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ data: data.questoes }, { status: 200 });
  } catch (error: unknown) {
    // Tratamento seguro do erro
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro Gemini:", error);

    return NextResponse.json(
      { error: "Falha interna.", details: errorMessage },
      { status: 500 },
    );
  }
}
