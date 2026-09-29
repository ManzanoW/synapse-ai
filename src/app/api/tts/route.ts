import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "pt-BR-ThalitaNeural" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }

    // 1. Limpeza de caracteres brutos e markdown
    let cleanText = text
      .replace(/\[\.\.\.\]/g, "lacuna")
      .replace(/[*_#`~>]/g, "")
      .replace(/&/g, "e")
      .replace(/</g, "")
      .replace(/>/g, "")
      .trim();

    // 2. Injeta micro-pausas respiratórias antes de explicações e respostas
    cleanText = cleanText
      .replace(/(Resposta:?)/gi, '$1 <break time="350ms"/>')
      .replace(
        /(Dica de fixação:?|Mnemônico:?)/gi,
        '<break time="250ms"/> $1 <break time="200ms"/>',
      )
      .replace(/\.\s+/g, '. <break time="300ms"/> ');

    // 3. Monta o SSML com prosódia didática (cadência ligeiramente mais pausada)
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
        <voice name="${voice}">
          <prosody rate="-4%" pitch="+0Hz">
            ${cleanText}
          </prosody>
        </voice>
      </speak>
    `.trim();

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream: readable } = tts.toStream(ssml);

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
