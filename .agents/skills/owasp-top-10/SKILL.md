---
name: owasp-top-10
description: Inspeciona rotas e regras de negocio contra vulnerabilidades comuns (OWASP Top 10), especialmente IDOR (Broken Object Level Authorization), vazamento de segredos e injecao de payload.
---

# OWASP Top 10 & API Security Inspection

Auditoria de segurança focada em aplicações web modernas (Next.js, Node.js, Prisma, PostgreSQL).

## Quando usar esta skill

- Ao implementar ou revisar Server Actions e Route Handlers (`app/api/**/route.ts`).
- Ao auditar operações de leitura, mutação ou deleção no banco de dados.
- Ao revisar variáveis de ambiente, headers de resposta ou sanitização de entrada.

## Pontos Críticos de Inspeção

### 1. Prevenção Rigorosa de IDOR (Broken Object Level Authorization)
- **Problema**: O cliente envia `resourceId` e o backend busca/atualiza o recurso sem validar se o recurso realmente pertence ao usuário autenticado (`userId`).
- **Padrão Obrigatório**:
  ```ts
  // ❌ VULNERÁVEL A IDOR:
  await prisma.post.update({
    where: { id: input.postId },
    data: { content: input.content }
  });

  // ✅ SEGURO:
  await prisma.post.update({
    where: {
      id: input.postId,
      userId: session.user.id // Filtro estrito de posse!
    },
    data: { content: input.content }
  });
  ```
- Em queries de leitura (`findUnique`, `findFirst`), sempre validar posse ou privilégios de role antes de devolver dados confidenciais.

### 2. Prevenção de Vazamento de Segredos e Chaves de API
- Chaves de API privadas (e.g. Stripe Secret Key, Prisma Direct URL, chaves de IA) **nunca** devem ter o prefixo `NEXT_PUBLIC_`.
- Respostas de API e serializações para Client Components não devem conter campos sensíveis (hashes de senha, tokens de reset, metadados internos). Use Projections (`select` específico no Prisma).

### 3. Validação de Payloads e Injeção
- Toda entrada recebida via `req.json()`, query params ou Server Actions deve ser obrigatoriamente validada por schemas rigorosos (Zod).
- Nunca execute queries cruas com concatenação de strings (`prisma.$queryRawUnsafe` sem bind variables).
- Limite o tamanho e o formato de dados em uploads ou payloads JSON para prevenir ataques de negação de serviço (ReDoS, JSON payload bombs).

### 4. Headers e Proteção de Transporte
- Garanta proteção de CSRF em rotas mutáveis que usem cookies de sessão.
- Utilize headers de segurança (HSTS, CSP, X-Content-Type-Options: nosniff).
