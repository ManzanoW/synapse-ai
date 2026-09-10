# Arquitetura e Regras de Desenvolvimento: App de Estudos com IA

## 1. Visão Geral & Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Estilização:** Tailwind CSS + Shadcn/ui (componentes em `src/components/ui`)
- **Estado & Dados:** React Hooks + Server Actions (para mutações)
- **Gerenciamento de Ícones:** Lucide React (`lucide-react`)

## 2. Convenções e Estrutura de Pastas

- `src/actions/`: Concentra todas as Server Actions para comunicação com banco/APIs.
- `src/app/`: Apenas roteamento, layouts (`layout.tsx`) e páginas (`page.tsx`). Evite colocar lógica de negócios pesada diretamente nas páginas.
- `src/components/`: Componentes divididos estritamente por domínio (`flashcards`, `decks`, `questions`, etc.).
- `src/types/`: Centraliza todas as interfaces e tipos do TypeScript (`.ts`).
- `src/hooks/`: Custom hooks para gerenciamento de estado local complexo.

## 3. Diretrizes Obrigatórias de Código (Padrões da IA)

1. **Tipagem:** Nunca use `any`. Importe ou defina os tipos em `src/types/`.
2. **Server Actions:** Sempre trate erros com blocos `try/catch` e retorne um objeto estruturado:
   `{ success: boolean, data?: T, error?: string }`.
3. **Componentes:**
   - Dê preferência a Server Components para busca de dados.
   - Use `'use client'` apenas quando houver interatividade (hooks, eventos, estado local).
   - Não crie elementos visuais base do zero se já existirem componentes em `src/components/ui/` (botões, inputs, modais).
4. **Imports:** Use aliases absolutos configurados no projeto (`@/components/...`, `@/actions/...`, `@/types/...`).

## 4. Regras de Negócio do App

- **Flashcards:** Operam sob lógica de repetição espaçada (SRS). Modificações no estado do card devem respeitar a interface `Card` oficial em `src/types/`.
- **IA/Prompts:** Respostas geradas por IA devem ser tratadas e validadas (JSON ou chamadas estruturadas) antes de salvar no banco ou renderizar na tela.
