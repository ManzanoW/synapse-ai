import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, "../../public/audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const items = [
  {
    filename: "bento-question.mp3",
    voice: "pt-BR-FranciscaNeural",
    text: "O mandado de segurança coletivo pode ser impetrado por partido político com representação no Congresso Nacional?",
  },
  {
    filename: "bento-answer.mp3",
    voice: "pt-BR-FranciscaNeural",
    text: "Sim! Conforme Artigo quinto, inciso setenta da Constituição Federal. Macete: basta um único parlamentar em qualquer uma das casas para legitimar a impetração!",
  },
  {
    filename: "cockpit-question.mp3",
    voice: "pt-BR-AntonioNeural",
    text: "Qual a legitimidade ativa extraordinária para impetração de Habeas Data segundo o Superior Tribunal de Justiça?",
  },
  {
    filename: "cockpit-answer.mp3",
    voice: "pt-BR-AntonioNeural",
    text: "Segundo a jurisprudência do Superior Tribunal de Justiça, o cônjuge supérstite ou os herdeiros possuem legitimidade para impetrar Habeas Data em defesa da memória do falecido.",
  },
];

async function generateAll() {
  console.log("Iniciando geração de áudios neurais estáticos com Edge TTS...");

  for (const item of items) {
    const filePath = path.join(audioDir, item.filename);
    console.log(`Gerando: ${item.filename} com a voz ${item.voice}...`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(item.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(item.text);

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const audioBuffer = Buffer.concat(chunks);
    fs.writeFileSync(filePath, audioBuffer);
    console.log(`✓ Gravado com sucesso: ${filePath} (${audioBuffer.length} bytes)`);
  }

  console.log("Todos os áudios estáticos da landing page foram gerados!");
}

generateAll().catch((err) => {
  console.error("Erro ao gerar áudios:", err);
  process.exit(1);
});
