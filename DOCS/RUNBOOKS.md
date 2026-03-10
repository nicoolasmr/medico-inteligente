# Medico Inteligente — Manual de Operação e Runbooks

Este documento descreve os procedimentos operacionais para a manutenção e evolução da plataforma médico inteligente.

## 1. Gestão de Banco de Dados (Prisma & Supabase)

### Aplicar Migrações
Sempre aplique migrações no banco local antes do deploy:
```bash
npm run db:migrate
```

### Reset de Dados de Teste
Para limpar e re-popular o banco com dados controlados:
```bash
# CUIDADO: Limpa o banco e roda o seed.ts
npx prisma migrate reset
npm run db:seed
```

## 2. Motor de Automações (BullMQ)

### Fluxo de Trabalho do Worker
As automações (Lembretes WhatsApp, IA) rodam em uma fila Redis.
- **Desenvolvimento**: `npm run worker`
- **Produção**: O worker deve rodar como um processo separado (PM2 ou Docker Sidecar).

### Falhas na Fila
Se as mensagens pararem de chegar:
1. Verifique a conexão com o **Upstash Redis**.
2. Reinicie o processo do worker.
3. Cheque os logs em `automation_logs` no banco de dados.

## 3. Segurança e Multi-tenancy

### Adicionar Novas Tabelas
Ao criar novas tabelas, **obrigatoriamente**:
1. Inclua a coluna `clinic_id` (UUID).
2. Habilite **RLS** (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`).
3. Crie a política usando `auth_clinic_id()`.

## 4. Integrações de IA (OpenAI)
- **Token Usage**: Monitore o consumo no dashboard da OpenAI.
- **Insights**: Se os insights parecerem "vagos", ajuste o `systemPrompt` no arquivo `app/(dashboard)/insights/actions.ts`.

## 5. Deployment (Handoff)
- **Build**: `npm run build` deve rodar sem erros.
- **Variáveis**: Certifique-se de que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretas no host.

---
*Runbook gerado pela equipe de Engenharia — mar/2026*
