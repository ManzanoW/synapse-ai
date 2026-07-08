import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Passamos o adapter explicitamente como o Prisma 7 exige no erro inicial
export const prisma = new PrismaClient({ adapter });