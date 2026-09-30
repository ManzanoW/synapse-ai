---
name: clean-code-refactor
description: Revisa e refatora o codigo procurando por vazamentos de memoria, loops O(N^2), acoplamento excessivo, falta de tratamento de erros em blocos assincronos e violacoes de Clean Code e SOLID.
---

# Clean Code & Refactor Patterns

Guia rigoroso para auditoria estática, eliminação de gargalos algorítmicos e refatoração arquitetural em JavaScript, TypeScript e Next.js.

## Quando usar esta skill

- Durante revisões de código (PR review) e refatoração de módulos existentes.
- Ao detectar lentidão de processamento em operações no backend/frontend.
- Para verificar acoplamento excessivo entre camadas ou componentes.
- Para inspecionar e tratar erros assíncronos não capturados (`unhandled rejections`).

## Checklist de Inspeção

### 1. Complexidade de Algoritmos e Loops $O(N^2)$
- **Evitar `.filter()`, `.find()` ou `.some()` aninhados dentro de `.map()` / `.forEach()`**:
  - *Anti-padrão*:
    ```ts
    const matched = users.map(user => orders.filter(o => o.userId === user.id)); // O(N * M)
    ```
  - *Refatoração para $O(N + M)$*:
    ```ts
    const ordersByUserId = Map.groupBy(orders, o => o.userId); // ou Map/Record auxiliar
    const matched = users.map(user => ordersByUserId.get(user.id) ?? []);
    ```

### 2. Prevenção de Vazamento de Memória (Memory Leaks)
- **Listeners e Subscriptions**:
  - Em React, todo `addEventListener`, `setInterval`, `setTimeout` ou conexão WebSocket deve retornar uma função de limpeza no `useEffect`.
- **Referências Globais e Caches Ilimitados**:
  - Evitar mapas ou arrays em escopo de módulo que crescem indefinidamente sem política de TTL ou limite LRU (Least Recently Used).
- **AbortController em Requisições**:
  - Cancelar fetch em andamento se o componente for desmontado ou a ação cancelada.

### 3. Tratamento de Erros em Blocos Assíncronos
- **`try / catch / finally`**:
  - Nunca deixe blocos `catch` vazios.
  - Não engula erros que devam ser propagados ou logados estruturadamente.
- **`Promise.all` vs `Promise.allSettled`**:
  - Use `Promise.allSettled` quando falhas parciais forem aceitáveis e devam ser tratadas individualmente.
  - Garanta que recursos abertos (transações, locks, file handles) sejam liberados no bloco `finally`.

### 4. Acoplamento Excessivo e SOLID
- **Princípio da Responsabilidade Única (SRP)**:
  - Funções devem ter um único propósito. Extraia funções auxiliares caso uma função passe de 30-40 linhas ou misture I/O com regras de negócio.
- **Inversão de Dependências (DIP)**:
  - Módulos de domínio não devem depender diretamente de implementações concretas de serviços externos (e.g. gateways de pagamento, clientes de email). Use interfaces/adaptadores.
