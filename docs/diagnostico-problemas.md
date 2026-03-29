# Diagnóstico de erros e problemas da plataforma

> Levantamento técnico feito via lint, typecheck, build, testes e revisão de código.

## Erros confirmados (reproduzíveis)

1. **Build de produção quebra por dependência de Google Fonts em tempo de build**
   - O arquivo `app/portal/layout.tsx` usa `next/font/google` (`Inter` e `Outfit`).
   - Em ambiente sem acesso ao endpoint do Google Fonts, o `next build` falha e impede deploy.
   - Impacto: **alto** (bloqueia release/CI em ambientes restritos).

2. **Aviso de configuração de ambiente no npm**
   - Todos os comandos npm exibem `Unknown env config "http-proxy"`.
   - Não bloqueia execução agora, mas indica configuração inválida que pode quebrar em versões futuras do npm.
   - Impacto: **baixo/médio** (dívida operacional).

## Problemas arquiteturais e de produto identificados no código

3. **Dados e identidade hardcoded na interface (risco de inconsistência e vazamento visual)**
   - Nome do médico fixo no dashboard (`"Bom dia, Dr. Nicolas"`).
   - Nome do usuário fixo no header (`"Dr. Nicolas Moreira"`) e no portal (`"Nicolas Moreira"`, `"Olá, Nicolas"`).
   - Impacto: **médio** (UX incorreta em multiusuário/produção).

4. **Dashboard com KPIs e alertas parcialmente mockados**
   - Tendências e alguns indicadores são valores fixos (`12`, `8`, `12500.50`, etc.).
   - Alertas também são estáticos.
   - Impacto: **médio/alto** (decisão de negócio baseada em dados não reais).

5. **Risco de dados órfãos no fluxo de cadastro da clínica (sem transação compensatória)**
   - `registerClinic` cria usuário auth, clínica e perfil em etapas sequenciais.
   - Se uma etapa intermediária falhar, não existe rollback explícito das anteriores.
   - Impacto: **alto** (integridade de dados e suporte operacional).

6. **Dependência rígida de variáveis de ambiente com non-null assertion**
   - Exemplo: `OPENAI_API_KEY!`, `NEXT_PUBLIC_SUPABASE_URL!`, `SUPABASE_SERVICE_ROLE_KEY!`.
   - Quando ausentes, o erro aparece em runtime/import, sem validação central amigável.
   - Impacto: **médio** (falhas em deploy e debug difícil).

## Pontos de atenção (não necessariamente bug imediato)

7. **Inicialização de Redis falha em import se `REDIS_URL` não existir**
   - Estratégia atual dá fail-fast (válido), mas pode derrubar contextos onde Redis não é necessário.
   - Impacto: **médio** dependendo da topologia de execução.

8. **Tratamento de erro limitado em carregamento de dados no frontend**
   - Páginas como dashboard carregam dados no `useEffect` sem fluxo explícito de erro para o usuário.
   - Em falha de rede/back-end, risco de tela inconsistente.
   - Impacto: **médio** (resiliência/UX).

## Estado atual de qualidade técnica (checks executados)

- `npm run lint`: sem erros.
- `npm run typecheck`: sem erros.
- `npx vitest run`: testes existentes passam.
- `npm run build`: falha no fetch de fontes Google.

## Priorização sugerida

1. **P0**: eliminar dependência de Google Fonts remotas no build (usar fonte local/fallback robusto).
2. **P0**: envolver `registerClinic` em transação/estratégia de compensação.
3. **P1**: remover hardcodes de identidade e usar dados reais do usuário logado.
4. **P1**: substituir KPIs/alertas mockados por cálculo real e telemetria confiável.
5. **P2**: padronizar validação de env vars e mensagens de erro.
6. **P2**: revisar configuração `http-proxy` do npm.
