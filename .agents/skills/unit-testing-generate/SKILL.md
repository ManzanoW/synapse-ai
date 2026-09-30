---
name: unit-testing-generate
description: Automatiza a criacao de testes unitarios e de integracao mockando conexoes externas, APIs de terceiros e bancos de dados (Prisma) usando Vitest e Testing Library.
---

# Unit & Integration Testing Generator

Diretrizes e gerador de suítes de testes unitários e de integração de alta cobertura usando **Vitest** e **TypeScript**, focando em testes determinísticos e isolados.

## Quando usar esta skill

- Ao implementar novos endpoints (Route Handlers), Server Actions ou serviços de domínio.
- Ao cobrir cenários de borda (edge cases), falhas de rede e validação de schema.
- Para gerar mocks de conexões de banco de dados (Prisma Client) ou APIs de terceiros.

## Padrões de Teste

### 1. Mocking do Prisma Client no Vitest

Use `vi.mock` para isolar a camada de banco de dados:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma'; // ou '@/src/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar o usuário com sucesso', async () => {
    const mockUser = { id: 'user_1', name: 'John Doe', email: 'john@example.com' };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    // Executa a função do serviço
    // const result = await getUserById('user_1');
    // expect(result).toEqual(mockUser);
    // expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user_1' } });
  });
});
```

### 2. Mocking de Conexões Externas e Fetch

- Nunca realize requisições HTTP reais em testes unitários.
- Utilize `vi.spyOn(global, 'fetch')` ou mocks explícitos dos SDKs de terceiros.
- Teste casos de sucesso (200), erro do cliente (400/404), limitação de taxa (429) e erro interno do servidor (500).

### 3. Estrutura AAA (Arrange, Act, Assert)

- **Arrange**: Prepare mocks, dados de entrada e estados iniciais.
- **Act**: Execute a função ou handler sendo testado.
- **Assert**: Valide os retornos, efeitos colaterais e se os mocks foram chamados com os parâmetros esperados.
