# Auditoria Profunda (v2) — 2026-03-11

## Objetivo
Executar uma auditoria técnica sênior com foco em estabilidade de build, riscos de runtime, segurança de dependências e qualidade de código.

## Estado atual (resumo executivo)
- Build da Vercel está passando no ambiente auditado.
- Lint, typecheck e testes unitários estão passando.
- O problema recorrente de `Module not found` em `app/` e `components/` foi mitigado.
- Ainda existem riscos importantes de produção que exigem ação.

## Erros e problemas identificados

### P0 — Segurança e disponibilidade
1. **Next.js em versão com aviso de vulnerabilidade**
   - Projeto está em `next@15.2.0`.
   - Recomendação: atualizar para patch seguro da linha 15.x.

2. **Uso residual de env vars com non-null assertion (`!`) em integrações críticas**
   - `lib/whatsapp.ts`: `WHATSAPP_PHONE_NUMBER_ID!` e `WHATSAPP_TOKEN!`.
   - `lib/ratelimit.ts`: `UPSTASH_REDIS_REST_URL!` e `UPSTASH_REDIS_REST_TOKEN!`.
   - Risco: erro de runtime não amigável em produção quando env não estiver configurada.

### P1 — Robustez de runtime
3. **`lib/supabase/client.ts` retorna objeto vazio tipado como `any` quando env falta**
   - Fallback atual: `return {} as any`.
   - Risco: falha tardia e pouco observável ao chamar métodos do cliente em runtime.

4. **Alto uso de `any`/casts agressivos em fluxos de negócio**
   - Ex.: dashboard/pipeline/automações/configurações/agenda.
   - Risco: reduz segurança de tipo e facilita bugs silenciosos.

5. **Auditoria de vulnerabilidades bloqueada no ambiente atual**
   - `npm audit --omit=dev` retorna `403` no endpoint de advisories.
   - Risco: baixa visibilidade de CVEs transitivas no pipeline atual.

### P2 — Qualidade de produto e manutenção
6. **Conteúdo mock/hardcoded residual em UX**
   - Ainda há textos e dados demonstrativos em alguns componentes.
   - Risco: inconsistência de experiência em produção (não quebra build, mas reduz qualidade percebida).

7. **Warning recorrente de configuração npm**
   - `Unknown env config "http-proxy"` em múltiplos comandos npm.
   - Risco: possível quebra em versões futuras do npm e ruído operacional.

## Verificações executadas
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npx vitest run` ✅
- `npm run vercel-build` ✅
- `npm audit --omit=dev` ⚠️ (403 no endpoint do npm)
- `npm ls next openai node-domexception --all` ✅
- varredura por `any`/`process.env.*!` ✅

## Plano de ação recomendado
1. **P0 imediato**: atualizar `next` para versão corrigida e validar `vercel-build`.
2. **P0 imediato**: substituir `process.env.*!` de `whatsapp`/`ratelimit` por `requireEnv`.
3. **P1 curto prazo**: remover `{} as any` em `lib/supabase/client.ts` (fail-fast controlado com erro explícito).
4. **P1 curto prazo**: reduzir `any` em actions/componentes críticos (começar por automações/pipeline).
5. **P1/P2**: habilitar auditoria de segurança efetiva em CI (ambiente com acesso ao endpoint).
6. **P2**: limpar dados/textos mock residuais na interface.

## Conclusão
A plataforma está estável para build no estado atual, mas ainda não está “à prova de erros”. Há pendências objetivas de segurança e robustez de runtime que devem ser tratadas para elevar maturidade operacional em produção.
