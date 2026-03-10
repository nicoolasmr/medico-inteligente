# Médico Inteligente — O Cérebro da sua Clínica

A plataforma **Médico Inteligente** é um Sistema Operacional de Crescimento inovador para consultórios médicos e odontológicos. Une gestão 360º (CRM, Agenda, Financeiro) com Inteligência Artificial para identificar oportunidades de lucro e fidelização.

---

## 🛠️ Exploração por Módulo

### 1. **Crescimento Impulsionado por IA (Insights)**
Nosso diferencial competitivo. O sistema não apenas guarda dados, ele os analisa.
- Detecção de gargalos no funil de tratamentos.
- Recomendações de marketing baseadas em procedimentos mais rentáveis.
- Análise de churn e sugestões de reativação de pacientes em tempo real.

### 2. **Pipeline de Tratamentos (High-Performance Kanban)**
Transforme consultas em faturamento com uma visão clara de negociação.
- Gestão de orçamentos pendentes.
- Cálculo automático de probabilidade de fechamento.
- Drag-and-drop fluido para progressão de casos clínicos.

### 3. **Agenda de Precisão**
Uma visão semanal projetada para zero fricção.
- Status coloridos para identificação imediata (Confirmado, Atrasado, Realizado).
- Criação de agendamentos via Side Sheet sem perder o contexto da semana.
- Lembretes automáticos integrados para reduzir No-Shows.

### 4. **CRM & Prontuário 3.0**
Histórico completo e segmentação avançada.
- Linha do tempo unificada de atendimentos e exames.
- Tags inteligentes para campanhas personalizadas (ex: "Paciente VIP", "Pós-Op").

---

## 🚀 Tecnologias

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
- **Backend:** Supabase (Postgres + Auth), Prisma ORM.
- **IA:** OpenAI API (GPT-4o).
- **Assincronismo:** BullMQ + Upstash Redis para automações resilientes.

---

## 📂 Documentação Técnica

Para detalhes profundos, explore nossa pasta `/DOCS`:
- [🏛️ Arquitetura do Sistema](DOCS/ARCHITECTURE.md)
- [🗄️ Modelagem de Banco de Dados](DOCS/DATABASE.md)
- [🔌 API & Server Actions](DOCS/API.md)

---

## 💻 Configuração Local

### Requisitos
- Node.js 20+
- Instância Supabase (ou Docker Local)
- Redis (Upstash recomendado)
- OpenAI API Key

### Passo a Passo
1. **Instalação:** `npm install`
2. **Ambiente:** Copie `.env.example` para `.env.local` e preencha as chaves.
3. **Banco de Dados:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts # Popula com dados demo
   ```
4. **Rodar:** `npm run dev`

---

## 🎨 Design System
Filosofia **Medical Precision Dark**: Visual premium com foco em legibilidade e precisão técnica. Tons de verde neon sobre fundos escuros para menor cansaço visual e estética "state-of-the-art".

---
Desenvolvido por Nicolas Moreira — 2026.
