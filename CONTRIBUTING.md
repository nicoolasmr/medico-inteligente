# Guia de Contribuição

Este guia descreve os padrões e processos para contribuir com a plataforma Médico Inteligente.

## 🎨 Padrões de Código

- **Componentes:** Use `use client` apenas quando necessário para interatividade.
- **Estilização:** Utilize classes utilitárias do Tailwind CSS. Siga o sistema de cores definido em `tailwind.config.ts`.
- **Arquitetura:** Mantenha a lógica de servidor em `actions.ts` dentro das pastas de rota sempre que possível.

## 🛤️ Estrutura de Rotas

As rotas são organizadas por grupos:
- `(auth)`: Login, registro e recuperação de senha.
- `(dashboard)`: Funcionalidades administrativas da clínica.
- `portal`: Interface para interação direta com o paciente.

## 🚀 Workflow de Desenvolvimento

1. Crie uma branch para sua funcionalidade/fix: `git checkout -b feature/nome-da-feature`.
2. Mantenha os compromissos (commits) claros e em português: `git commit -m "feat: adiciona link de faturamento no dashboard"`.
3. Certifique-se de que os tipos TypeScript estão corretos.
4. Teste os fluxos interligados antes de enviar o PR.
