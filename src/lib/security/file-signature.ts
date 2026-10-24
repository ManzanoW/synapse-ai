// src/lib/security/file-signature.ts

/**
 * 🛡️ AppSec (OWASP File Upload Hardening):
 * Valida a assinatura binária real (Magic Bytes) de arquivos PDF e Imagens,
 * prevenindo o envio de executáveis, scripts ou payloads maliciosos renomeados
 * com extensão .pdf, .png ou .jpg.
 */

export function isValidPdfSignature(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length < 5) return false;
  // A especificação PDF permite que o cabeçalho "%PDF-" apareça nos primeiros 1024 bytes
  const limit = Math.min(bytes.length - 4, 1024);
  for (let i = 0; i < limit; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

export function isValidImageOrPdfSignature(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length < 4) return false;

  // 1. PDF (%PDF-)
  if (isValidPdfSignature(bytes)) return true;

  // 2. PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }

  // 3. JPEG (FF D8 FF)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }

  // 4. GIF (GIF87a / GIF89a -> 47 49 46 38)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return true;
  }

  // 5. WEBP (RIFF....WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return true;
  }

  // 6. HEIC / AVIF (ISO Base Media File Format: bytes 4..7 == "ftyp")
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  ) {
    return true;
  }

  return false;
}

/**
 * 🛡️ Sanitiza mensagens de erro antes de devolvê-las ao cliente em Server Actions,
 * garantindo que erros técnicos de banco de dados (Prisma/SQL/Host) nunca vazem.
 */
export function sanitizeActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!(error instanceof Error) || !error.message) {
    return fallbackMessage;
  }

  const msg = error.message;
  const sensitivePatterns =
    /prisma|postgres|supabase|neon\.tech|connection|ECONNREFUSED|ETIMEDOUT|SELECT\s|INSERT\s|UPDATE\s|DELETE\s|Unique constraint|Foreign key constraint|Invalid `prisma/i;

  if (sensitivePatterns.test(msg)) {
    return fallbackMessage;
  }

  return msg;
}
