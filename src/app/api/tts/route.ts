import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;
    const voice = body?.voice || "pt-BR-FranciscaNeural";

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }

    // Limpeza de texto: remove markdown e garante pontuação legível
    const cleanText = text
      .replace(/\[\.\.\.\]/g, "lacuna")
      .replace(/[*_#`~>]/g, "")
      .replace(/&/g, "e")
      .replace(/<[^>]*>/g, "")
      .replace(/\n+/g, ". ")
      .replace(/(Resposta:?)/gi, "$1, ")
      .replace(/(Dica de fixação:?|Mnemônico:?)/gi, ", $1, ")
      .replace(/\s+/g, " ")
      .trim();

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(cleanText);

    // Converte os chunks do stream em Buffer final
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error: any) {
    console.error("ERRO NO SERVIDOR /api/tts:", error?.message || error);
    return NextResponse.json(
      { error: "Falha interna ao sintetizar áudio", message: error?.message },
      { status: 500 },
    );
  }
}
