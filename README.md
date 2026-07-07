# Sistema Ecomm — Gestão de Loja Shopee

Sistema simples para controlar produtos, estoque, compras, fornecedores, vendas, despesas e relatórios.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Banco**: PostgreSQL (via Docker Compose)

## Como rodar localmente

1. Subir o banco de dados:
   ```bash
   npm run db:up
   ```
2. Instalar dependências:
   ```bash
   npm install
   ```
3. Configurar variáveis de ambiente (copie `server/.env.example` para `server/.env`).
4. Rodar as migrations e o seed:
   ```bash
   npm run prisma:migrate
   npm run seed
   ```
5. Subir client + server juntos:
   ```bash
   npm run dev
   ```
6. Acessar `http://localhost:5173`. Login criado pelo seed: veja `server/prisma/seed.ts`.

## Estrutura

- `server/` — API REST (Express + Prisma)
- `client/` — SPA (Vite + React)
- `docker-compose.yml` — banco Postgres local
