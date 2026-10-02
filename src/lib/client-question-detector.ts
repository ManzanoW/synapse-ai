/**
 * synapse-ai - client-question-detector.ts
 *
 * Barreira client-side de pré-validação óptica para o Scanner OCR.
 * Analisa a imagem no navegador antes de qualquer requisição à API de IA,
 * avaliando contraste, densidade de arestas de texto e características de documento de prova.
 * Evita desperdício de tokens de IA e poupa a cota do usuário em imagens sem questão (logos, fotos lisas, memes, etc.).
 */

export interface ImageQuestionValidationResult {
  /** Se a imagem atende aos critérios mínimos de documento com texto/questão */
  isValid: boolean;
  /** Pontuação de densidade de texto estimada entre 0 e 100 */
  textConfidenceScore: number;
  /** Mensagem explicativa para o usuário */
  message?: string;
  /** Sugestão de correção caso seja inválida */
  suggestion?: string;
  /** Nível de confiança: "high" | "moderate" | "low" */
  confidenceLevel: "high" | "moderate" | "low";
}

/**
 * Analisa a imagem localmente via HTML5 Canvas (executa em ~5ms a 15ms no navegador)
 */
export async function validateImageForQuestion(
  file: File,
): Promise<ImageQuestionValidationResult> {
  // 1. Verificação preliminar de integridade e tamanho de arquivo
  if (file.size < 4 * 1024) {
    return {
      isValid: false,
      textConfidenceScore: 5,
      confidenceLevel: "low",
      message: "Imagem muito pequena ou corrompida.",
      suggestion: "Envie uma foto com resolução suficiente para leitura das questões.",
    };
  }

  // Se for PDF ou ambiente não-navegador (SSR), permite seguir para validação no server
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return {
      isValid: true,
      textConfidenceScore: 75,
      confidenceLevel: "moderate",
    };
  }

  return new Promise<ImageQuestionValidationResult>((resolve) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = async () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        const { width, height } = img;

        // 2. Dimensões mínimas razoáveis para uma questão de concurso
        if (width < 140 || height < 100) {
          resolve({
            isValid: false,
            textConfidenceScore: 10,
            confidenceLevel: "low",
            message: "Dimensões da imagem muito reduzidas para conter uma questão.",
            suggestion: "Envie uma foto ou print maior da apostila ou prova.",
          });
          return;
        }

        // 3. Suporte opcional à TextDetector API nativa do Chromium (se disponível no navegador)
        if ("TextDetector" in window) {
          try {
            // @ts-expect-error - TextDetector é API experimental em navegadores Chromium
            const detector = new window.TextDetector();
            const detectedBlocks = await detector.detect(img);
            if (Array.isArray(detectedBlocks) && detectedBlocks.length >= 2) {
              resolve({
                isValid: true,
                textConfidenceScore: 95,
                confidenceLevel: "high",
                message: "Texto e estrutura de questão identificados com sucesso.",
              });
              return;
            }
          } catch {
            // Se falhar ou não suportar, segue para a análise heurística de Canvas abaixo
          }
        }

        // 4. Análise Heurística via Canvas em escala reduzida (240x240 para ultra performance)
        const sampleSize = 240;
        const canvas = document.createElement("canvas");
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          // Fallback seguro se canvas 2d não estiver disponível
          resolve({
            isValid: true,
            textConfidenceScore: 60,
            confidenceLevel: "moderate",
          });
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalLuma = 0;
        const lumaList = new Float32Array(sampleSize * sampleSize);

        // Converte cada pixel para luminância perceptiva (Rec. 601)
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          lumaList[p] = luma;
          totalLuma += luma;
        }

        const meanLuma = totalLuma / lumaList.length;

        // Calcula desvio padrão de luminância
        let varianceSum = 0;
        for (let p = 0; p < lumaList.length; p++) {
          const diff = lumaList[p] - meanLuma;
          varianceSum += diff * diff;
        }
        const stdDevLuma = Math.sqrt(varianceSum / lumaList.length);

        // Se o desvio padrão de luminância for quase nulo (< 12), é uma imagem lisa/sólida (preta, branca ou cor única)
        if (stdDevLuma < 12) {
          resolve({
            isValid: false,
            textConfidenceScore: 2,
            confidenceLevel: "low",
            message: "A imagem não apresenta contraste ou conteúdo legível.",
            suggestion: "Envie uma foto de um documento com texto visível.",
          });
          return;
        }

        // Contagem de transições de alto contraste (bordas de texto horizontais)
        // Documentos de questões contêm centenas de alternâncias entre papel e caracteres
        let horizontalTransitions = 0;
        const contrastThreshold = 40; // Variação mínima entre fundo e tinta

        for (let y = 10; y < sampleSize - 10; y += 2) {
          const rowOffset = y * sampleSize;
          for (let x = 1; x < sampleSize; x++) {
            const diff = Math.abs(lumaList[rowOffset + x] - lumaList[rowOffset + x - 1]);
            if (diff > contrastThreshold) {
              horizontalTransitions++;
            }
          }
        }

        // Normalização de densidade de transição
        // Amostra de ~110 linhas analisadas com 240 pixels cada = ~26.400 comparações
        const testedComparisons = (sampleSize - 20) / 2 * sampleSize;
        const transitionRatio = (horizontalTransitions / testedComparisons) * 100;

        // Distribuição de luminância extrema (típica de fundo claro + texto escuro ou vice-versa)
        let extremePixels = 0;
        for (let p = 0; p < lumaList.length; p++) {
          const luma = lumaList[p];
          if (luma < 60 || luma > 200) {
            extremePixels++;
          }
        }
        const extremeRatio = (extremePixels / lumaList.length) * 100;

        // Cálculo da pontuação final
        // transitionRatio em documentos costuma variar entre 6% e 35%
        // Imagens sem texto (logos lisos, comidas, fotos) costumam ter transitionRatio < 3.2%
        let score = Math.round(
          Math.min(100, Math.max(0, transitionRatio * 3.5 + extremeRatio * 0.25)),
        );

        // Se tiver boa bimodalidade e transições razoáveis, sobe o score
        if (transitionRatio >= 4.5 && extremeRatio > 35) {
          score = Math.max(70, score);
        }

        // Limiar de rejeição para evitar envio de imagens que não são questões
        // Imagens como logos simples de restaurantes ou desenhos isolados pontuam < 25
        if (score < 28 || transitionRatio < 2.5) {
          resolve({
            isValid: false,
            textConfidenceScore: score,
            confidenceLevel: "low",
            message: "A imagem não parece conter uma questão de prova ou texto de concurso.",
            suggestion:
              "Certifique-se de fotografar uma apostila, folha de caderno, livro ou captura de simulado com enunciado e alternativas.",
          });
          return;
        }

        resolve({
          isValid: true,
          textConfidenceScore: score,
          confidenceLevel: score >= 65 ? "high" : "moderate",
          message: "Texto e conteúdo de questão identificados.",
        });
      };

      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve({
          isValid: true,
          textConfidenceScore: 50,
          confidenceLevel: "moderate",
        });
      };

      img.src = objectUrl;
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: true,
        textConfidenceScore: 50,
        confidenceLevel: "moderate",
      });
    }
  });
}
