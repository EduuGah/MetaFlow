# MetaFlow 🎯

> Um PWA full-stack moderno, leve e fluido para gerenciamento de projetos, metas pessoais, tarefas e checklists interativos.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 🚀 Sobre o Projeto

O **MetaFlow** foi desenvolvido para transformar metas e objetivos complexos em passos simples e mensuráveis. Com uma interface limpa e responsiva, a aplicação permite criar projetos, dividi-los em tarefas e gerenciar listas de verificação (*checklists*) com barras de progresso dinâmicas.

Como um **Progressive Web App (PWA)**, o MetaFlow pode ser instalado diretamente em dispositivos móveis (Android/iOS) ou no desktop, oferecendo uma experiência fluida de aplicativo nativo.

---

## ✨ Funcionalidades Principais

- 🔐 **Autenticação com Google OAuth:** Login simples e seguro via Supabase Auth.
- 🎯 **Gerenciamento de Metas & Projetos:** Crie objetivos, defina descrições e acompanhe prazos.
- 📋 **Tarefas & Checklists Interativos:** Adicione o passo a passo detalhado de cada etapa.
- 📊 **Cálculo de Progresso Automático:** Barras de progresso visuais atualizadas conforme os itens são concluídos.
- 👥 **Compartilhamento via Link:** Convide colaboradores para visualizar ou editar metas.
- 📱 **PWA & Mobile-First:** Instalável no celular, suporte a telas sensíveis ao toque e navegação otimizada.
- 🛡️ **Segurança Avançada (RLS):** Proteção de dados direto no PostgreSQL com Row Level Security.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, React Router DOM.
- **Estilização & Ícones:** Tailwind CSS, Lucide Icons.
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth com Google OAuth, Realtime Engine, RLS).
- **PWA:** `vite-plugin-pwa`, Web App Manifest e Service Workers.

---

## 🔧 Como Executar Localmente

### Pré-requisitos
- Node.js (v18.x ou superior)
- npm ou yarn
- Conta ativa no Supabase

### 1. Clonar o repositório
```bash
git clone [https://github.com/EduuGah/metaflow.git](https://github.com/EduuGah/metaflow.git)
cd metaflow