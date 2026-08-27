import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  prismaInstance = new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString: "postgresql://mock:mock@localhost:5432/mock",
      }),
    ),
  });
} else {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({
      connectionString,
      ssl: {
        // Ignora erros de certificado autoassinado (causado por NextDNS/proxy local)
        rejectUnauthorized: false,
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
