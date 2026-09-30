---
name: react-performance
description: Garante o uso idiomatico de hooks modernos (useOptimistic, useTransition, useCallback), memoizacao correta e prevencao de re-renderizacoes em cascata em React e Next.js.
---

# React Performance Optimization

Guia para maximizar a performance de renderização, uso correto de hooks concorrentes e prevenção de re-renderizações desnecessárias em React 18/19 e Next.js App Router.

## Quando usar esta skill

- Ao criar ou refatorar componentes React com estados complexos ou animações.
- Ao implementar Server Actions com feedback instantâneo na UI.
- Ao identificar re-renderizações em cascata ou lentidão no DOM.
- Ao auditar uso de hooks de memoização (`useMemo`, `useCallback`, `memo`).

## Diretrizes Fundamentais

### 1. Hooks Modernos Concorrentes

- **`useTransition`**: Utilize para transições não-urgentes de estado (e.g. filtragens, paginações, buscas em tempo real), mantendo a interface responsiva durante o processamento.
  ```tsx
  const [isPending, startTransition] = useTransition();
  const handleFilter = (query: string) => {
    startTransition(() => {
      setFilter(query);
    });
  };
  ```

- **`useOptimistic`**: Atualizações otimistas imediatas em conjunto com Server Actions. Evite spinners desnecessários em mutações onde a falha é rara.
  ```tsx
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state, newItem: Item) => [...state, newItem]
  );
  ```

- **`useDeferredValue`**: Use para adiar a renderização de listas ou árvores pesadas dependentes de inputs do usuário.

### 2. Prevenção de Re-renderizações em Cascata

- **Composição em vez de prop drilling excessivo**: Isole árvores de componentes frequentemente re-renderizadas como `children` de componentes estáveis.
- **Context Granularity**: Evite armazenar estados de alta frequência (e.g., scroll, digitação rápida, mouse coords) no mesmo Context de autenticação ou tema. Separe contextos de leitura e mutação.
- **Evitar objetos inline como props**: Objetos literais `{}` ou funções arrow inline repassadas a componentes memoizados quebram o cache referencial.

### 3. Memoização Correta (`useMemo` e `useCallback`)

- Não memoize operações triviais (e.g. somas simples ou transformações em arrays com < 50 itens).
- Memoize callbacks passados como dependência para `useEffect` ou para componentes envolvidos por `React.memo`.
- Garanta que arrays de dependências estejam estritamente corretos sem ignorar avisos do linter.

### 4. Code Splitting & Dynamic Imports

- No Next.js App Router, componentes pesados no lado do cliente (gráficos, editores ricos, modais raramente abertos) devem ser carregados sob demanda com `next/dynamic` ou `React.lazy`.
