import type { PrismaClient } from "@prisma/client";
import { createMockPrismaClient } from "./mock-prisma";

const globalForPrisma = globalThis as unknown as { prisma?: any };

const connectionString = process.env.DATABASE_URL;
const isMockOrLocal =
  !connectionString ||
  connectionString.includes("mock");

let prismaClientInstance: any;

if (isMockOrLocal) {
  if (!globalForPrisma.prisma) {
    console.log("[AI Studio] Database URL not provided or using local placeholder — initializing in-memory store.");
    globalForPrisma.prisma = createMockPrismaClient();
  }
  prismaClientInstance = globalForPrisma.prisma;
} else {
  if (!globalForPrisma.prisma) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require("pg");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaPg } = require("@prisma/adapter-pg");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require("@prisma/client");

      const pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const adapter = new PrismaPg(pool);
      const realPrisma = new PrismaClient({ adapter });
      const mockFallback = createMockPrismaClient();

      // Transparent error fallback proxy
      globalForPrisma.prisma = new Proxy(realPrisma, {
        get(target: any, prop: string) {
          if (prop === "$transaction") {
            return async (...args: any[]) => {
              try {
                if (typeof target.$transaction === "function") {
                  return await target.$transaction(...args);
                }
              } catch (err) {
                console.warn(
                  "[AI Studio] Database $transaction failed, falling back to in-memory store:",
                  err instanceof Error ? err.message : err,
                );
              }
              return await mockFallback.$transaction(...args);
            };
          }

          const original = target[prop];
          if (typeof original === "object" && original !== null) {
            return new Proxy(original, {
              get(subTarget: any, subProp: string) {
                const subMethod = subTarget[subProp];
                if (typeof subMethod === "function") {
                  return async (...args: any[]) => {
                    try {
                      return await subMethod.apply(subTarget, args);
                    } catch (err) {
                      console.warn(
                        `[AI Studio] Database query failed on ${prop}.${subProp}, falling back to in-memory store:`,
                        err instanceof Error ? err.message : err,
                      );
                      const mockTarget = mockFallback[prop];
                      if (mockTarget && typeof mockTarget[subProp] === "function") {
                        return mockTarget[subProp](...args);
                      }
                      return null;
                    }
                  };
                }
                return subMethod;
              },
            });
          }
          return original;
        },
      });
    } catch (e) {
      console.warn("[AI Studio] Failed to initialize Prisma with PostgreSQL adapter, using in-memory mock:", e);
      globalForPrisma.prisma = createMockPrismaClient();
    }
  }
  prismaClientInstance = globalForPrisma.prisma;
}

export const prisma = prismaClientInstance as PrismaClient;
