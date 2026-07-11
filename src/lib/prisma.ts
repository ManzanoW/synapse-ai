import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Cria o escopo global seguro para o TypeScript não recriar conexões no desenvolvimento
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

// Pega a URL de conexão do ambiente
const connectionString = process.env.DATABASE_URL;

// Se a URL não existir (acontece durante o worker de build do Next.js),
// nós criamos um cliente vazio ou mockado para a compilação passar direto
if (!connectionString) {
  // Inicialização fake para o compilador estático do Next.js ignorar o erro de parâmetro vazio
  prismaInstance = new PrismaClient({
    // Passamos um adapter dummy apenas para o construtor do Prisma 7 aceitar a instância no build
    adapter: new PrismaPg(
      new Pool({
        connectionString: "postgresql://mock:mock@localhost:5432/mock",
      }),
    ),
  });
} else {
  // Fluxo real de execução (Desenvolvimento e Produção)
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
