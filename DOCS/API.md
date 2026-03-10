# Catálogo de APIs e Server Actions — Medico Inteligente

A plataforma prioriza o uso de **Next.js Server Actions** para uma comunicação type-safe entre frontend e backend.

## 1. Pacientes (CRM)

| Função | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `getPatients` | `filters` | `Patient[]` | Lista pacientes da clínica com filtros. |
| `getPatient` | `id` | `Patient` | Prontuário completo com histórico. |
| `createPatient` | `data` | `ActionResult<Patient>` | Cadastro de novo paciente (Validação Zod). |
| `updatePatient` | `id, data` | `ActionResult<Patient>` | Atualiza dados cadastrais. |

## 2. Agenda

| Função | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `getAppointments` | `from, to` | `Appointment[]` | Busca consultas no intervalo da semana. |
| `createAppointment` | `data` | `ActionResult` | Cria agendamento com validação de conflito. |
| `updateStatus` | `id, status` | `ActionResult` | Altera para 'Confirmado', 'Cancelado', etc. |

## 3. Financeiro & Pipeline

| Função | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `getRevenueSummary` | - | `RevenueSummary` | KPIs financeiros para o dashboard. |
| `moveTreatment` | `id, stage` | `ActionResult` | Move card no Kanban (Drag-and-drop). |
| `generateAnalysis` | - | `ActionResult` | Aciona o motor de IA para novos insights. |

## 4. Webhooks (API REST)

Endpoints públicos para integrações externas:
- `POST /api/webhooks/whatsapp`: Recebe status de entrega e mensagens de pacientes.
- `POST /api/webhooks/stripe`: Sincroniza pagamentos de mensalidade do plano SaaS.

## 5. Estrutura de Resposta Padrão

Todas as ações que realizam mutação retornam o tipo `ActionResult<T>`:
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

---
**Nota:** Todas as requisições exigem um token JWT válido no cabeçalho (gerido pelo Supabase Auth) e o clinicId é resolvido no lado do servidor.
