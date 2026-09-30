---
name: code-review-ai
description: Revisa o codigo procurando por vazamento de memoria, loops O(N^2), acoplamento excessivo, falta de tratamento de erros em blocos assincronos e quebra de regras de negocio.
---

# Code Review AI Specialist

Especialista em revisão automatizada de código, detecção precoce de regressões, dívida técnica e padrões anti-performáticos.

## Quando usar esta skill

- Ao finalizar uma funcionalidade antes de criar um commit ou pull request.
- Ao revisar diffs de código gerados por agentes ou desenvolvedores.
- Para realizar auditoria em arquivos com alta complexidade ciclomática.

## Focos da Revisão

1. **Eficiência e Complexidade**:
   - Detecção de loops aninhados com operações de busca interna ($O(N^2)$).
   - Otimização de queries de banco (evitar problema N+1 no Prisma).
2. **Resiliência e Erros Assíncronos**:
   - Verificação de blocos `try/catch` em chamadas assíncronas.
   - Garantia de encerramento seguro e liberação de conexões/recursos.
3. **Acoplamento e Limpeza**:
   - Isolamento de regras de negócio fora de componentes visuais ou controllers.
   - Remoção de variáveis não utilizadas e imports órfãos.
