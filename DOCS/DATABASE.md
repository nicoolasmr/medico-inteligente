# Documentação de Banco de Dados — Medico Inteligente

O banco de dados é baseado em PostgreSQL (gerenciado via Supabase) e modelado para suportar alta volumetria e isolamento multi-tenant.

## 1. Diagrama de Relacionamentos (Lógico)

A entidade raiz é a `Clinic`. Todas as outras tabelas dependem dela para isolamento.

- **Clinics**: Cadastro da clínica, plano (SaaS tiers) e configurações globais.
- **Users**: Profissionais da clínica. Relacionados via `auth.users` do Supabase.
- **Patients**: CRM central. Contém dados demográficos e tags.
- **Appointments**: Agendamentos vinculados a um paciente e um médico.
- **Treatments**: Funil de vendas (Kanban). Vincula pacientes a estágios de negociação.
- **Payments**: Registros financeiros, vinculados ou não a tratamentos/agendamentos.
- **Automations**: Regras de gatilho para ações automáticas (WhatsApp/IA).

## 2. Estratégia de Isolamento (RLS)

NUNCA confie apenas na aplicação para filtrar dados. O banco de dados possui políticas de segurança em nível de linha:

```sql
-- Exemplo de política de segurança
CREATE POLICY p_patients ON patients FOR ALL
  USING (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()));
```

## 3. Índices Críticos

Para garantir performance em clínicas com milhares de pacientes:
- **idx_patients_name_trgm**: Busca fonética/parcial rápida por nome.
- **idx_appts_clinic_date**: Filtro ultra-rápido para a visão de agenda semanal.
- **idx_payments_clinic_date**: Performance para relatórios financeiros e KPIs.

## 4. Migrações

As migrações são geridas via Prisma (`prisma/schema.prisma`) para tipagem no código e arquivos SQL puros em `supabase/migrations/` para a infraestrutura.

---
**Dica de Performance:** Sempre utilize o `clinicId` como primeiro filtro em qualquer Query SQL personalizada.
