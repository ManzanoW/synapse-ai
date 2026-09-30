import { NextResponse } from "next/server";

export interface TokenBucketOptions {
  /** Capacidade máxima do bucket (burst tolerado) */
  capacity: number;
  /** Quantidade de tokens reabastecidos por intervalo */
  refillTokensPerInterval: number;
  /** Intervalo em milissegundos para reposição (padrão 60000ms = 1 minuto) */
  intervalMs?: number;
  /** Tempo máximo em ms para expirar e limpar entradas inativas (padrão 1 hora) */
  ttlMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  retryAfterSeconds: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
  lastAccessed: number;
}

export class TokenBucketRateLimiter {
  private capacity: number;
  private refillTokensPerInterval: number;
  private intervalMs: number;
  private ttlMs: number;
  private buckets = new Map<string, BucketState>();
  private lastCleanup: number = Date.now();

  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0) throw new Error("A capacidade deve ser maior que 0.");
    if (options.refillTokensPerInterval <= 0) throw new Error("A taxa de reposição deve ser maior que 0.");

    this.capacity = options.capacity;
    this.refillTokensPerInterval = options.refillTokensPerInterval;
    this.intervalMs = options.intervalMs ?? 60000;
    this.ttlMs = options.ttlMs ?? 3600000; // 1 hora
  }

  /**
   * Tenta consumir tokens de um identificador (IP, userId, etc.)
   */
  public consume(key: string, tokensToConsume: number = 1, now: number = Date.now()): RateLimitResult {
    this.cleanupOldBuckets(now);

    const tokensPerMs = this.refillTokensPerInterval / this.intervalMs;
    let state = this.buckets.get(key);

    if (!state) {
      state = {
        tokens: this.capacity,
        lastRefill: now,
        lastAccessed: now,
      };
      this.buckets.set(key, state);
    }

    // Calcula tokens reabastecidos desde a última verificação
    const timePassedMs = Math.max(0, now - state.lastRefill);
    const addedTokens = timePassedMs * tokensPerMs;
    const currentTokens = Math.min(this.capacity, state.tokens + addedTokens);

    state.tokens = currentTokens;
    state.lastRefill = now;
    state.lastAccessed = now;

    const tokensNeededToFull = Math.max(0, this.capacity - state.tokens);
    const resetInSeconds = Math.ceil(tokensNeededToFull / (tokensPerMs * 1000));

    if (state.tokens >= tokensToConsume) {
      state.tokens -= tokensToConsume;
      const remainingTokens = Math.floor(state.tokens);

      return {
        success: true,
        limit: this.capacity,
        remaining: remainingTokens,
        resetInSeconds,
        retryAfterSeconds: 0,
      };
    }

    // Tokens insuficientes (Rate limit atingido)
    const missingTokens = tokensToConsume - state.tokens;
    const retryAfterSeconds = Math.max(1, Math.ceil(missingTokens / (tokensPerMs * 1000)));

    return {
      success: false,
      limit: this.capacity,
      remaining: Math.floor(state.tokens),
      resetInSeconds,
      retryAfterSeconds,
    };
  }

  /**
   * Reseta o estado de um identificador específico
   */
  public reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Limpa todas as entradas (útil para testes unitários)
   */
  public clear(): void {
    this.buckets.clear();
  }

  /**
   * Retorna o total de buckets rastreados atualmente
   */
  public size(): number {
    return this.buckets.size;
  }

  /**
   * Limpeza periódica de chaves antigas inativas para evitar vazamento de memória
   */
  private cleanupOldBuckets(now: number): void {
    // Roda no máximo uma vez a cada minuto
    if (now - this.lastCleanup < 60000) return;
    this.lastCleanup = now;

    for (const [key, state] of this.buckets.entries()) {
      if (now - state.lastAccessed > this.ttlMs) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Extrai o identificador de cliente (userId ou IP)
 */
export function getClientIdentifier(request?: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;

  if (!request) return "client:anonymous";

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0].trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp.trim()}`;

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return `ip:${cfIp.trim()}`;

  return "client:anonymous";
}

/**
 * Aplica o rate limiting e gera headers padronizados RFC
 */
export function checkRateLimitAndGenerateResponse(
  limiter: TokenBucketRateLimiter,
  identifier: string
): {
  allowed: boolean;
  result: RateLimitResult;
  headers: Record<string, string>;
  response?: NextResponse;
} {
  const result = limiter.consume(identifier);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetInSeconds),
  };

  if (!result.success) {
    headers["Retry-After"] = String(result.retryAfterSeconds);

    const response = NextResponse.json(
      {
        error: "Limite de requisições excedido. Aguarde antes de tentar novamente.",
        retryAfterSeconds: result.retryAfterSeconds,
      },
      {
        status: 429,
        headers,
      }
    );

    return {
      allowed: false,
      result,
      headers,
      response,
    };
  }

  return {
    allowed: true,
    result,
    headers,
  };
}

// ============================================================================
// INSTÂNCIAS COMPARTILHADAS PARA ROTAS CRÍTICAS DE IA
// ============================================================================

/** Rate limiter para geração de questões (12 por minuto, burst de 5) */
export const questionGenerationLimiter = new TokenBucketRateLimiter({
  capacity: 5,
  refillTokensPerInterval: 12,
  intervalMs: 60000,
});

/** Rate limiter para avaliação de discursivas (6 por minuto, burst de 3) */
export const discursivaEvaluationLimiter = new TokenBucketRateLimiter({
  capacity: 3,
  refillTokensPerInterval: 6,
  intervalMs: 60000,
});

/** Rate limiter para geração de simulados completos (8 por minuto, burst de 4) */
export const simuladoGenerationLimiter = new TokenBucketRateLimiter({
  capacity: 4,
  refillTokensPerInterval: 8,
  intervalMs: 60000,
});
