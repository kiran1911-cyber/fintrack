# Workspace

## Overview

**FinTrack AI** — Full-stack personal finance app with expense tracking, investment advisor, AI chat, and wallet linking (Groww & Binance).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4 + Recharts + Zustand + Framer Motion
- **Auth**: Replit Auth (OIDC/PKCE) via `@workspace/replit-auth-web`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API (port 8080 → /api)
│   └── fintrack/           # React+Vite frontend (port 23162 → /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── replit-auth-web/    # Browser auth hook (useAuth)
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## Features

### Authentication
- Replit Auth (OIDC with PKCE), cookie-based sessions stored in PostgreSQL
- `useAuth()` hook from `@workspace/replit-auth-web`

### Expense Tracking
- CRUD expenses with categories, date, amount, notes
- Categories: Food, Transport, Entertainment, Shopping, Health, Utilities, Rent, Other
- Monthly filters, search by category

### Dashboard
- Monthly summary cards (total spend, top category, count)
- Daily spending bar chart (Recharts)
- Category breakdown pie chart (Recharts)
- Previous month comparison

### Investment Advisor
- Input: monthly income, savings, risk tolerance, goal, age
- Static logic generates personalized portfolio allocations
- Covers: Mutual Funds, Index Funds, PPF/NPS, ELSS, Gold ETF, etc.
- Results shown as cards + allocation pie chart
- Profiles saved per user

### AI Chat
- Chat box with conversation history
- OpenAI GPT-4o-mini if `OPENAI_API_KEY` env var is set
- Smart fallback responses for common financial questions (savings, investing, budgeting)
- Suggestion chips for quick queries

### Wallet Linking
- Link Groww (stocks/mutual funds) and Binance (crypto) accounts
- Optional API key input for Binance
- Simulated portfolio view with holdings, gain/loss, total value
- Read-only — FinTrack AI cannot trade or move funds

### PWA
- `public/manifest.json` included
- PWA-ready: name "FinTrack AI", theme dark navy

## Database Schema

Tables:
- `users` — Replit Auth users
- `sessions` — Cookie sessions (Replit Auth)
- `expenses` — User expenses (id, userId, title, amount, category, date, notes)
- `investment_profiles` — Saved financial profiles per user
- `linked_wallets` — Connected Groww/Binance accounts
- `chat_history` — Chat message log (optional)

## API Routes

All routes are under `/api`:

| Route | Method | Description |
|-------|--------|-------------|
| `/healthz` | GET | Health check |
| `/auth/user` | GET | Current auth state |
| `/login` | GET | Start OIDC login |
| `/callback` | GET | OIDC callback |
| `/logout` | GET | Logout + clear session |
| `/expenses` | GET/POST | List/create expenses |
| `/expenses/:id` | GET/PUT/DELETE | Get/update/delete expense |
| `/expenses/summary/monthly` | GET | Monthly summary with charts data |
| `/investment/advice` | POST | Get investment recommendations |
| `/wallets` | GET | List linked wallets |
| `/wallets/link` | POST | Link a wallet |
| `/wallets/:id/unlink` | DELETE | Unlink a wallet |
| `/wallets/:id/portfolio` | GET | Get portfolio for linked wallet |
| `/chat/message` | POST | Send AI chat message |

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with auth middleware, Replit Auth OIDC, Drizzle ORM queries.

### `artifacts/fintrack` (`@workspace/fintrack`)

React+Vite SPA. Key packages:
- `recharts` — Charts (bar, pie)
- `zustand` — State (filters, chat history)
- `framer-motion` — Animations
- `react-hook-form` + `zod` — Form validation
- `@workspace/api-client-react` — Generated React Query hooks
- `@workspace/replit-auth-web` — Auth hook

## Development

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/fintrack run dev`
- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Push DB schema: `pnpm --filter @workspace/db run push`
