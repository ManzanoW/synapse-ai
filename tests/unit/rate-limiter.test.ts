import { describe, it, expect, beforeEach } from "vitest";
import {
  TokenBucketRateLimiter,
  getClientIdentifier,
  checkRateLimitAndGenerateResponse,
} from "@/lib/rate-limiter";

describe("TokenBucketRateLimiter", () => {
  let limiter: TokenBucketRateLimiter;

  beforeEach(() => {
    // 5 tokens de capacidade, reabastece 10 tokens por minuto (1 token a cada 6 segundos)
    limiter = new TokenBucketRateLimiter({
      capacity: 5,
      refillTokensPerInterval: 10,
      intervalMs: 60000,
    });
  });

  it("deve permitir consumo de tokens até atingir a capacidade máxima", () => {
    const key = "user-123";

    // 1º consumo
    const res1 = limiter.consume(key, 1);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(4);
    expect(res1.limit).toBe(5);

    // Consome mais 4 tokens (total = 5)
    expect(limiter.consume(key, 1).success).toBe(true);
    expect(limiter.consume(key, 1).success).toBe(true);
    expect(limiter.consume(key, 1).success).toBe(true);
    const res5 = limiter.consume(key, 1);
    expect(res5.success).toBe(true);
    expect(res5.remaining).toBe(0);

    // 6º consumo deve ser barrado com status 429 logic
    const res6 = limiter.consume(key, 1);
    expect(res6.success).toBe(false);
    expect(res6.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("deve reabastecer tokens de acordo com o tempo decorrido", () => {
    const key = "user-refill";
    const startTime = 1000000;

    // Esvazia todos os 5 tokens no startTime
    expect(limiter.consume(key, 5, startTime).success).toBe(true);
    expect(limiter.consume(key, 1, startTime).success).toBe(false);

    // Passam 12 segundos (com 10 tokens/60s = 1 token a cada 6s -> 2 tokens novos gerados)
    const after12s = startTime + 12000;
    const res = limiter.consume(key, 1, after12s);
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(1); // tinha 2, gastou 1, sobra 1

    // Passam mais 60 segundos (deve ter reabastecido até o limite máximo de 5)
    const after72s = after12s + 60000;
    const resCap = limiter.consume(key, 1, after72s);
    expect(resCap.success).toBe(true);
    expect(resCap.remaining).toBe(4); // atingiu o teto 5, consumiu 1 -> 4
  });

  it("deve isolar o consumo entre diferentes usuários/chaves", () => {
    const userA = "user-a";
    const userB = "user-b";

    // Esgota userA
    expect(limiter.consume(userA, 5).success).toBe(true);
    expect(limiter.consume(userA, 1).success).toBe(false);

    // userB deve continuar com bucket cheio
    const resB = limiter.consume(userB, 1);
    expect(resB.success).toBe(true);
    expect(resB.remaining).toBe(4);
  });

  it("deve resetar uma chave específica quando solicitado", () => {
    const key = "user-to-reset";
    limiter.consume(key, 5);
    expect(limiter.consume(key, 1).success).toBe(false);

    limiter.reset(key);
    expect(limiter.consume(key, 1).success).toBe(true);
  });

  it("deve validar parâmetros de construção inválidos", () => {
    expect(() => new TokenBucketRateLimiter({ capacity: 0, refillTokensPerInterval: 5 })).toThrow();
    expect(() => new TokenBucketRateLimiter({ capacity: 5, refillTokensPerInterval: 0 })).toThrow();
  });
});

describe("getClientIdentifier", () => {
  it("deve priorizar userId quando fornecido", () => {
    const id = getClientIdentifier(undefined, "user-abc");
    expect(id).toBe("user:user-abc");
  });

  it("deve extrair o primeiro IP de x-forwarded-for quando não há userId", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      },
    });
    expect(getClientIdentifier(req, null)).toBe("ip:203.0.113.195");
  });

  it("deve extrair x-real-ip quando não há x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-real-ip": "198.51.100.1",
      },
    });
    expect(getClientIdentifier(req, null)).toBe("ip:198.51.100.1");
  });

  it("deve retornar anonymous quando nenhuma informação estiver presente", () => {
    expect(getClientIdentifier(undefined, null)).toBe("client:anonymous");
  });
});

describe("checkRateLimitAndGenerateResponse", () => {
  it("deve retornar allowed true com headers X-RateLimit quando dentro da cota", () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 3,
      refillTokensPerInterval: 3,
    });

    const check = checkRateLimitAndGenerateResponse(limiter, "test-client");
    expect(check.allowed).toBe(true);
    expect(check.response).toBeUndefined();
    expect(check.headers["X-RateLimit-Limit"]).toBe("3");
    expect(check.headers["X-RateLimit-Remaining"]).toBe("2");
  });

  it("deve retornar allowed false com status 429 e header Retry-After quando exceder", () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 1,
      refillTokensPerInterval: 1,
      intervalMs: 60000,
    });

    // 1º consome o token disponível
    checkRateLimitAndGenerateResponse(limiter, "exceeded-client");

    // 2º estoura a cota
    const check = checkRateLimitAndGenerateResponse(limiter, "exceeded-client");
    expect(check.allowed).toBe(false);
    expect(check.response).toBeDefined();
    expect(check.response?.status).toBe(429);
    expect(check.headers["Retry-After"]).toBeDefined();
  });
});
