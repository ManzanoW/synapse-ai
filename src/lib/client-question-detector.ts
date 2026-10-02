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
 * Executa a análise heurística de contraste e transições de caracteres sobre os pixels do Canvas.
 */
function evaluatePixelData(
  data: Uint8ClampedArray,
  sampleSize: number,
): ImageQuestionValidationResult {
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
    return {
      isValid: false,
      textConfidenceScore: 2,
      confidenceLevel: "low",
      message: "A imagem não apresenta contraste ou conteúdo legível.",
      suggestion: "Envie uma foto de um documento com texto visível.",
    };
  }

  // Contagem de transições de alto contraste (bordas de texto horizontais)
  // Documentos de questões contêm centenas de alternâncias entre papel e caracteres
  let horizontalTransitions = 0;
  const contrastThreshold = 38;

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
  const testedComparisons = ((sampleSize - 20) / 2) * sampleSize;
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

  let score = Math.round(
    Math.min(100, Math.max(0, transitionRatio * 3.5 + extremeRatio * 0.25)),
  );

  if (transitionRatio >= 4.5 && extremeRatio > 35) {
    score = Math.max(70, score);
  }

  // Limiar de rejeição para evitar envio de imagens que não são questões (logos lisos, comidas, fotos sem texto)
  if (score < 26 || transitionRatio < 2.2) {
    return {
      isValid: false,
      textConfidenceScore: score,
      confidenceLevel: "low",
      message: "A imagem não parece conter uma questão de prova ou texto de concurso.",
      suggestion:
        "Certifique-se de fotografar uma apostila, folha de caderno, livro ou captura de simulado com enunciado e alternativas.",
    };
  }

  return {
    isValid: true,
    textConfidenceScore: score,
    confidenceLevel: score >= 65 ? "high" : "moderate",
    message: "Texto e conteúdo de questão identificados.",
  };
}

/**
 * Analisa a imagem localmente via HTML5 Canvas (executa em ~5ms a 15ms no navegador).
 * Utiliza createImageBitmap quando disponível para prevenir SecurityError por cross-origin tainting.
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

  const sampleSize = 240;

  // 2. Método Primário Seguro: createImageBitmap (sem risco de canvas tainting por blob URL)
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;

      // Dimensões mínimas razoáveis para uma questão de concurso
      if (width < 140 || height < 100) {
        bitmap.close?.();
        return {
          isValid: false,
          textConfidenceScore: 10,
          confidenceLevel: "low",
          message: "Dimensões da imagem muito reduzidas para conter uma questão.",
          suggestion: "Envie uma foto ou print maior da apostila ou prova.",
        };
      }

      const canvas = document.createElement("canvas");
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        bitmap.close?.();
        return {
          isValid: true,
          textConfidenceScore: 65,
          confidenceLevel: "moderate",
        };
      }

      ctx.drawImage(bitmap, 0, 0, sampleSize, sampleSize);
      bitmap.close?.();

      try {
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        return evaluatePixelData(imgData.data, sampleSize);
      } catch (ctxErr) {
        console.warn("Aviso ao extrair pixels do canvas:", ctxErr);
        // Fallback seguro caso haja restrição de sandbox do navegador
        return {
          isValid: true,
          textConfidenceScore: 70,
          confidenceLevel: "moderate",
        };
      }
    } catch (bitmapErr) {
      console.warn("createImageBitmap falhou, tentando fallback com FileReader:", bitmapErr);
    }
  }

  // 3. Método Secundário: FileReader como Data URL (mesma origem, sem cross-origin tainting)
  return new Promise<ImageQuestionValidationResult>((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            try {
              const width = img.naturalWidth || img.width;
              const height = img.naturalHeight || img.height;

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

              const canvas = document.createElement("canvas");
              canvas.width = sampleSize;
              canvas.height = sampleSize;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });

              if (!ctx) {
                resolve({
                  isValid: true,
                  textConfidenceScore: 65,
                  confidenceLevel: "moderate",
                });
                return;
              }

              ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

              try {
                const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                resolve(evaluatePixelData(imgData.data, sampleSize));
              } catch (getImageDataErr) {
                console.warn("SecurityError ignorado no getImageData:", getImageDataErr);
                // Fallback seguro: se o navegador bloquear leitura direta de pixels, permite avançar
                resolve({
                  isValid: true,
                  textConfidenceScore: 70,
                  confidenceLevel: "moderate",
                });
              }
            } catch (innerErr) {
              console.warn("Erro no processamento da imagem:", innerErr);
              resolve({
                isValid: true,
                textConfidenceScore: 65,
                confidenceLevel: "moderate",
              });
            }
          };

          img.onerror = () => {
            resolve({
              isValid: true,
              textConfidenceScore: 60,
              confidenceLevel: "moderate",
            });
          };

          img.src = reader.result as string;
        } catch (imgSetupErr) {
          console.warn("Erro ao configurar imagem no FileReader:", imgSetupErr);
          resolve({
            isValid: true,
            textConfidenceScore: 60,
            confidenceLevel: "moderate",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          isValid: true,
          textConfidenceScore: 60,
          confidenceLevel: "moderate",
        });
      };

      reader.readAsDataURL(file);
    } catch (readerErr) {
      console.warn("FileReader falhou:", readerErr);
      resolve({
        isValid: true,
        textConfidenceScore: 60,
        confidenceLevel: "moderate",
      });
    }
  });
}
