import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

      Retorne ESTRITAMENTE um objeto JSON válido no seguinte formato:
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

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
