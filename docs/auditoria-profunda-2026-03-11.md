# Auditoria Profunda — 2026-03-11

## Escopo
Auditoria técnica de estabilidade de build, resolução de módulos, qualidade estática e riscos de produção.

## Resultado executivo
- ✅ Build de produção (`vercel-build`) está **passando**.
- ✅ Lint, typecheck e testes automatizados estão **passando**.
- ✅ Não há mais imports `@/...` em `app/` e `components/` (ponto crítico que estava causando erros recorrentes de `Module not found` no deploy).
- ⚠️ Existem pendências de segurança/dependências e configuração de ambiente que não quebram o build atual, mas precisam de tratamento.

## Verificações executadas
- `npm run lint`
- `npm run typecheck`
- `npx vitest run`
- `npm run vercel-build`
- `npm audit --omit=dev` (bloqueado por 403 do registry no ambiente)
- `npm ls next node-domexception --all`
- busca de imports alias em `app/` e `components/`

## Achados

### 1) Status de build/deploy — OK
A pipeline `vercel-build` conclui com sucesso e gera todas as rotas sem erro de compilação.

**Impacto:** resolvido para os erros recorrentes de resolução de módulo.

### 2) Segurança: Next.js em versão com aviso de CVE
A aplicação está em `next@15.2.0`.

**Risco:** médio/alto (segurança).  
**Ação recomendada:** subir para versão corrigida da linha 15.2.x/15.x conforme boletim oficial.

### 3) Dependência transitiva deprecada
`node-domexception@1.0.0` aparece como transitiva de `openai -> formdata-node`.

**Risco:** baixo (depreciação, não quebra imediata).  
**Ação recomendada:** atualizar `openai` quando houver cadeia sem essa dependência deprecada.

### 4) Auditoria de vulnerabilidades não executável neste ambiente
`npm audit --omit=dev` retorna `403 Forbidden` no endpoint de advisories.

**Risco:** médio operacional (visibilidade parcial de segurança).  
**Ação recomendada:** rodar auditoria em CI com acesso ao endpoint npm/advisories.

### 5) Configuração de ambiente com warning recorrente
Comandos npm exibem `Unknown env config "http-proxy"`.

**Risco:** baixo/médio (pode quebrar em versões futuras do npm).  
**Ação recomendada:** limpar/ajustar `.npmrc`/env para remover chave inválida.

### 6) Conteúdo mock/hardcoded residual em UI
Ainda existem textos/dados de demonstração hardcoded em alguns pontos (exemplos de nomes de médicos e histórico fictício).

**Risco:** baixo para build; médio para percepção de produção/consistência de dados.  
**Ação recomendada:** substituir por dados reais quando houver backend correspondente.

## Priorização recomendada
1. **P0:** upgrade do `next` para versão corrigida de segurança.
2. **P1:** normalizar ambiente npm (`http-proxy`) e habilitar `npm audit` no CI com acesso.
3. **P2:** remover conteúdo mock residual de UI e consolidar feature flags/dados reais.

## Conclusão
A causa dos erros recorrentes de build foi mitigada no código atual, com pipeline verde. Restam pendências de segurança/ambiente e acabamento de produto, mas não há bloqueio técnico imediato para build/deploy neste estado.
