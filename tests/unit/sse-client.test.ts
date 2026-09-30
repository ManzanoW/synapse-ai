import { describe, it, expect, vi } from "vitest";
import { streamSimuladoGeneration } from "@/lib/sse-client";

describe("SSE Client Layer (Server-Sent Events)", () => {
  it("deve processar eventos SSE progressivos de init, chunk e complete", async () => {
    const eventsSequence = [
      'event: init\ndata: {"materia":"Direito Constitucional","banca":"FGV","qtdQuestoes":5}\n\n',
      'event: chunk\ndata: {"startIndex":0,"questions":[{"id":"q1"}],"receivedSoFar":1,"total":5}\n\n',
      'event: complete\ndata: {"success":true,"id":"simulado-123","total":5,"data":[{"id":"q1"}]}\n\n',
    ];

    const encoder = new TextEncoder();
    let currentIdx = 0;

    const mockReadableStream = new ReadableStream({
      pull(controller) {
        if (currentIdx < eventsSequence.length) {
          controller.enqueue(encoder.encode(eventsSequence[currentIdx]));
          currentIdx++;
        } else {
          controller.close();
        }
      },
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      body: mockReadableStream,
    }));

    const onInit = vi.fn();
    const onChunk = vi.fn();
    const onComplete = vi.fn();

    await streamSimuladoGeneration(
      {
        banca: "FGV",
        materia: "Direito Constitucional",
        qtdQuestoes: 5,
      },
      {
        onInit,
        onChunk,
        onComplete,
      }
    );

    expect(onInit).toHaveBeenCalledWith(
      expect.objectContaining({ materia: "Direito Constitucional", banca: "FGV" })
    );
    expect(onChunk).toHaveBeenCalledWith(
      expect.objectContaining({ receivedSoFar: 1, total: 5 })
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, id: "simulado-123" })
    );
  });

  it("deve acionar o fallback para /api/questions/generate caso o endpoint SSE falhe", async () => {
    const fallbackResponse = {
      success: true,
      id: "simulado-fallback",
      data: [{ id: "fallback-q1" }],
      total: 1,
    };

    // Primeiro fetch (stream) falha com 500, segundo fetch (fallback) sucede com 200
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        body: null,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fallbackResponse,
      })
    );

    const onComplete = vi.fn();

    await streamSimuladoGeneration(
      {
        banca: "Cebraspe",
        materia: "Direito Administrativo",
        qtdQuestoes: 10,
      },
      {
        onComplete,
      }
    );

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "simulado-fallback" })
    );
  });
});
