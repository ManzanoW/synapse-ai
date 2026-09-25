/**
 * Utilitário client-side para redimensionamento e compressão de imagens via Canvas HTML5.
 * Reduz fotos de alta resolução (8MB - 15MB) para ~300KB - 500KB mantendo total fidelidade
 * de caligrafia, traçados de caneta e pautas para visão computacional / OCR.
 */

export interface CompressImageOptions {
  /** Maior dimensão (largura ou altura) permitida. Padrão: 1800px */
  maxDimension?: number;
  /** Qualidade de compressão JPEG entre 0.1 e 1.0. Padrão: 0.85 */
  quality?: number;
  /** Tamanho máximo em bytes abaixo do qual nenhuma compressão é realizada. Padrão: 500KB */
  skipThresholdBytes?: number;
}

export async function compressClientImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxDimension = 1800,
    quality = 0.85,
    skipThresholdBytes = 500 * 1024,
  } = options;

  // Se não estiver no navegador ou o tipo não for imagem suportada, retorna intacto
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Se a imagem já for leve, não gasta CPU do dispositivo
  if (file.size <= skipThresholdBytes) {
    return file;
  }

  return new Promise<File>((resolve) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Mantém aspect ratio contendo dentro de maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Configuração de renderização de alta fidelidade para preservar letras finas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Se porventura o blob comprimido for maior que o original, mantém o original
              resolve(file);
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanFileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(file);
    }
  });
}
