export interface StreamSimuladoParams {
  banca: string;
  materia: string;
  topicoId?: string | null;
  topicoNome?: string | null;
  specificTopic?: string;
  qtdQuestoes: number;
  dificuldade?: string;
  textoBase?: string | null;
  fonteConteudo?: string;
  adaptiveMode?: boolean;
  formatoQuestao?: string;
  nivelCargo?: string;
  preferCachedQuestions?: boolean;
}

export interface StreamProgressCallbacks {
  onInit?: (data: { materia: string; banca: string; qtdQuestoes: number }) => void;
  onChunk?: (data: {
    startIndex: number;
    questions: any[];
    receivedSoFar: number;
    total: number;
  }) => void;
  onComplete?: (data: {
    success: boolean;
    id: string | null;
    simuladoId: string | null;
    quizId: string | null;
    total: number;
    data: any[];
    usedModel?: string;
    durationMs?: number;
    isFallbackPool?: boolean;
  }) => void;
  onError?: (error: Error) => void;
}

/**
 * Lê e decodifica um fluxo Server-Sent Events (SSE) da rota de geração de simulados,
 * com fallback automático para a rota tradicional caso SSE seja bloqueado.
 */
export async function streamSimuladoGeneration(
  params: StreamSimuladoParams,
  callbacks: StreamProgressCallbacks,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch("/api/questions/generate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Falha ao conectar ao stream de geração (status ${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;

        let eventType = "message";
        let eventDataRaw = "";

        const lines = block.split("\n");
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            eventDataRaw = line.replace("data:", "").trim();
          }
        }

        if (!eventDataRaw) continue;

        try {
          const parsed = JSON.parse(eventDataRaw);
          if (eventType === "init") {
            callbacks.onInit?.(parsed);
          } else if (eventType === "chunk") {
            callbacks.onChunk?.(parsed);
          } else if (eventType === "complete") {
            callbacks.onComplete?.(parsed);
          }
        } catch (jsonErr) {
          console.warn("[sse-client] Erro ao parsear chunk SSE:", jsonErr);
        }
      }
    }
  } catch (err: unknown) {
    console.warn("[sse-client] Stream interrompido ou indisponível. Recorrendo a fallback tradicional:", err);

    // 🛡️ Fallback transparente para a rota tradicional síncrona
    try {
      const fallbackRes = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal,
      });

      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        throw new Error(fallbackData.error || "Falha na geração de simulado.");
      }

      callbacks.onComplete?.(fallbackData);
    } catch (finalErr) {
      callbacks.onError?.(finalErr instanceof Error ? finalErr : new Error("Erro desconhecido."));
    }
  }
}
