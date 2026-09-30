import { auth } from "@/auth";
import {
  generateSimuladoInParallel,
  getDeterministicFallbackQuestions,
} from "@/lib/simulado-generator";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Faça login para gerar simulados com IA." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Payload JSON inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    banca,
    materia,
    topicoId,
    topicoNome,
    specificTopic,
    qtdQuestoes,
    dificuldade,
    textoBase,
    fonteConteudo,
    adaptiveMode,
    formatoQuestao,
    nivelCargo,
    preferCachedQuestions,
  } = body;

  if (!banca || !materia || !qtdQuestoes) {
    return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        try {
          const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Controller pode ter sido fechado pelo cliente
        }
      };

      try {
        // 1. Notifica início do processamento progressivo
        sendEvent("init", {
          materia,
          banca,
          qtdQuestoes: Number(qtdQuestoes),
          timestamp: Date.now(),
        });

        // 2. Executa a geração balanceada (cache semântico + lotes paralelos da IA + fallback determinístico)
        const result = await generateSimuladoInParallel(
          {
            banca,
            materia,
            topicoId,
            topicoNome,
            specificTopic:
              typeof specificTopic === "string" ? specificTopic.trim() : undefined,
            qtdQuestoes,
            dificuldade,
            textoBase,
            fonteConteudo,
            adaptiveMode: Boolean(adaptiveMode),
            formatoQuestao,
            nivelCargo,
            preferCachedQuestions: Boolean(preferCachedQuestions),
          },
          userId,
        );

        const simuladoId = result.quizId || result.sessionId;
        const questions = result.data || [];

        // 3. Emite as questões geradas em chunks para renderização progressiva
        const chunkSize = 2;
        for (let i = 0; i < questions.length; i += chunkSize) {
          const chunk = questions.slice(i, i + chunkSize);
          sendEvent("chunk", {
            startIndex: i,
            questions: chunk,
            receivedSoFar: Math.min(i + chunkSize, questions.length),
            total: questions.length,
          });
        }

        // 4. Consumo de cota apenas se IA foi acionada
        if (!result.isFallbackPool) {
          await consumeAiQuota(userId, "SIMULADO").catch(() => {});
        }

        // 5. Emite evento final de conclusão com ID do simulado pronto para resolução
        sendEvent("complete", {
          success: true,
          id: simuladoId,
          simuladoId: simuladoId,
          quizId: simuladoId,
          total: questions.length,
          data: questions,
          usedModel: result.usedModel,
          durationMs: result.durationMs,
          isFallbackPool: Boolean(result.isFallbackPool),
        });
      } catch (streamError) {
        console.error("[stream/route] Erro no stream de geração, acionando contingência:", streamError);

        // Fallback garantido sem quebrar a conexão
        const fallback = await getDeterministicFallbackQuestions({
          materia: String(materia),
          topicoId: topicoId !== "ALL" ? String(topicoId) : null,
          banca: String(banca),
          qtdQuestoes: Math.max(1, Number(qtdQuestoes)),
        });

        sendEvent("complete", {
          success: true,
          id: null,
          simuladoId: null,
          quizId: null,
          total: fallback.length,
          data: fallback,
          isFallbackPool: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
