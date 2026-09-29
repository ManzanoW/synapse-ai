import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "pt-BR-FranciscaNeural" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }

    // Limpa caracteres especiais e markdown antes da síntese
    const cleanText = text
      .replace(/\[\.\.\.\]/g, "lacuna")
      .replace(/[*_#`~>]/g, "")
      .replace(/\n+/g, ". ")
      .trim();

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream: readable } = tts.toStream(cleanText);

    // Converte o Readable Stream em Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of readable) {
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
  } catch (error) {
    console.error("Erro na síntese neural MsEdgeTTS:", error);
    return NextResponse.json(
      { error: "Falha ao sintetizar áudio" },
      { status: 500 },
    );
  }
}
