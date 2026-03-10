# Medico Inteligente — Sistema Operacional de Crescimento para Clínicas

Plataforma SaaS Healthtech integrada para gestão 360º de consultórios médicos e odontológicos. Focada em precisão clínica, automação de jornada e crescimento estratégico impulsionado por IA.

## 🚀 Funcionalidades Principais

### 1. CRM de Pacientes (Prontuário Digital)
- Gestão completa de pacientes com histórico unificado.
- Linha do tempo de interações (consultas, exames, mensagens).
- Tags inteligentes para segmentação e campanhas.

### 2. Agenda Inteligente
- Calendário semanal moderno e responsivo.
- Controle de status (Agendado, Confirmado, Realizado, Cancelado).
- Side sheet para criação rápida de agendamentos sem sair da visão principal.

### 3. Pipeline de Tratamentos (Kanban)
- Funil de vendas dental/médico com drag-and-drop.
- Estágios personalizáveis: Lead -> Consulta -> Orçamento -> Aprovado -> Realizado.
- Visualização de probabilidade e valor projetado.

### 4. IA de Crescimento (Growth AI)
- Integração profunda com OpenAI (GPT-4o).
- Análise automática de gargalos no funil de conversão.
- Recomendações estratégicas de marketing e fidelização baseadas em dados reais da clínica.

### 5. Motor de Automações
- Gatilhos automáticos (Lembretes 24h antes, Pesquisa de satisfação pós-consulta).
- Integração com WhatsApp e SMS para redução de No-Show.

### 6. Gestão Financeira
- Fluxo de caixa com KPIs de receita e ticket médio.
- Lançamentos por procedimento e controle de inadimplência.
- Relatórios de performance financeira.

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4.
- **UI Components:** shadcn/ui (Radix UI) com tema *Medical Precision Dark*.
- **Backend:** Next.js Server Actions, Supabase (Auth & Database).
- **ORM:** Prisma.
- **Assincronismo:** BullMQ & Redis (Upstash) para filas de mensagens e automações.
- **IA:** OpenAI SDK.

## 📦 Como Instalar

1. **Clone o repositório:**
```bash
git clone https://github.com/nicoolasmr/medico-inteligente.git
cd medico-inteligente
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env.local` na raiz com as chaves:
- `DATABASE_URL` (Supabase Postgres)
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_URL` & `UPSTASH_REDIS_TOKEN`

4. **Prepare o banco de dados:**
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

5. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

## 🎨 Design System

O projeto utiliza a filosofia **Medical Precision Dark**:
- **Cores:** Teal (#00D4AA) sobre Dark (#0A0D14).
- **Tipografia:** Outfit (Display) e Inter (Reading).
- **Componentes:** Bordas afiadas (2-4px) para transmitir seriedade e precisão técnica.

## 📄 Licença

Uso exclusivo para Nicolas Moreira - Plataformas MEDICO-INTELIGENTE.
