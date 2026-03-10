# Arquitura do Sistema — Medico Inteligente

Este documento detalha as decisões técnicas, padrões de design e o fluxo de dados da plataforma.

## 1. Filosofia de Design: "Medical Precision Dark"

A interface foi construída para transmitir confiança, precisão e modernidade.
- **Paleta de Cores:** Fundo em `#0A0D14` (Deep Space) com acentos em `#00D4AA` (Neon Teal). Evitamos cores genéricas como azul real ou roxo para manter a identidade exclusiva do setor médico.
- **Tipografia:** 
  - **Outfit:** Utilizada para títulos e elementos de display para um visual moderno.
  - **Inter:** Utilizada para leitura e dados densos pela sua alta legibilidade.
- **Componentes:** Bordas com raio de 2-4px. Bordas muito arredondadas (pílulas) foram evitadas em elementos principais para manter a percepção de "precisão clínica".

## 2. Tecnologias Core

- **Next.js 15 (App Router):** Escolhido pelas Server Actions (reduzindo a necessidade de APIs REST complexas) e pelo suporte a React 19.
- **React 19:** Utilização de novas APIs como `useActionState` para feedback instantâneo de formulários.
- **Supabase:** Backend-as-a-Service para Autenticação, Banco de Dados (PostgreSQL) e Realtime.
- **Prisma ORM:** Camada de acesso a dados tipada, garantindo que erros de esquema sejam detectados em tempo de compilação.
- **Tailwind CSS v4:** Motor de estilização ultra-rápido com tokens de design centralizados em `app/globals.css`.

## 3. Isolamento Multi-tenant (Segurança)

A plataforma é estritamente multi-tenant. Cada clínica (Tenant) possui seu próprio espaço isolado.
- **RLS (Row Level Security):** Todas as consultas ao banco de dados passam por políticas do Supabase que garantem que um usuário só acesse dados de sua própria `clinic_id`.
- **Middleware:** Protege rotas do dashboard e injeta o contexto da clínica nas requisições.
- **Server Actions:** Todas as funções no backend validam o `clinicId` do usuário autenticado antes de qualquer operação.

## 4. Fluxo de Automação e IA

- **Motor de Filas (BullMQ):** Tarefas pesadas ou agendadas (como envio de lembretes WhatsApp) são processadas em segundo plano para não travar a interface.
- **OpenAI Integration:** O módulo de Insights utiliza o modelo `gpt-4o` para analisar dados anonimizados da clínica (KPIs de receita e conversão) e gerar recomendações estratégicas.

---
**Status da Arquitetura:** Escalonável para 1000+ clínicas.
