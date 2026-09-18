# FoodPOS — Smart Restaurant Management

A full-stack restaurant Point-of-Sale (POS) and management dashboard. Modern React + TypeScript frontend, Express + Prisma backend.

## Quick Start

```bash
npm install       # installs root, frontend, and backend dependencies
npm run dev       # starts frontend (Vite) and backend (Express + Prisma) together
```

No need to open two terminals — `concurrently` runs both servers at once.

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Commands

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start frontend and backend in development    |
| `npm run build`   | Production-build frontend and backend        |
| `npm install`     | Install dependencies for root + sub-projects |

## Tech Stack

**Frontend** (`frontend/`)

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Router 6
- TanStack Query
- React Hook Form + Zod
- Recharts
- Lucide React icons

**Backend** (`backend/`)

- Node.js + Express 4
- TypeScript
- Prisma ORM (SQLite by default, PostgreSQL-compatible schema)
- Zod-based request validation
- Centralized error handling

## Project Structure

```
├── frontend/            # React SPA (UI code only)
│   └── src/
│       ├── components/  # layout, sidebar, header, cards, charts, pos, tables, ui
│       ├── pages/       # Dashboard, POS, Menu, Tables, Orders, Inventory, Reports, Settings
│       ├── services/    # centralized API client (axios)
│       ├── types/       # shared TS types
│       ├── utils/       # helpers
│       └── ...
├── backend/             # REST API (server code only)
│   ├── prisma/          # schema.prisma, seed.ts
│   └── src/
│       ├── routes/      # dashboard, menu-items, categories, tables, orders, inventory, reports
│       └── app.ts, server.ts
├── package.json         # root scripts (dev / build / install)
└── README.md
```

## Pages

- **Dashboard** — sales stats, sales overview chart, top selling items
- **POS / Billing** — category browsing, product grid, interactive order cart, table selection, tax + total, place order
- **Menu Management** — search, category filters, CRUD with validation
- **Table Management** — table cards with available / occupied / reserved states
- **Order Management** — status tabs, order detail modal, status progression
- **Inventory / Stock** — stock table, low-stock alerts, add/update stock
- **Reports** — sales analytics, chart, top selling items
- **Settings** — restaurant profile and preferences

## API Overview

| Endpoint                 | Method | Description              |
| ------------------------ | ------ | ------------------------ |
| `/api/dashboard`         | GET    | Dashboard stats + items  |
| `/api/menu-items`        | GET/POST | Menu management       |
| `/api/menu-items/:id`    | PUT/DELETE | Update/delete item   |
| `/api/categories`        | GET    | Menu categories         |
| `/api/tables`            | GET/POST | Tables                |
| `/api/tables/:id`        | PUT    | Update table status      |
| `/api/orders`            | GET/POST | Orders                |
| `/api/orders/:id/status` | PUT    | Update order status      |
| `/api/inventory`         | GET/POST | Inventory            |
| `/api/inventory/:id`     | PUT    | Update stock            |
| `/api/reports/sales`     | GET    | Sales report            |
| `/api/health`            | GET    | Health check            |

## Database Setup

The app uses Prisma with SQLite by default, so **no database server is required**.

- `frontend/` default port `5173`, API proxied to `http://localhost:5000`
- `backend/.env` configures `DATABASE_URL`, `PORT`, `CORS_ORIGIN`

After first clone/install:

```bash
cd backend
npx prisma db push   # creates the SQLite database
npx ts-node prisma/seed.ts   # seeds categories, menu, tables, orders, inventory
```

To switch to PostgreSQL, update `backend/prisma/schema.prisma` (provider = "postgresql") and `DATABASE_URL` in `backend/.env`, then `npx prisma migrate dev`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` (already provided as `backend/.env` for local dev).

- `DATABASE_URL` — SQLite file or PostgreSQL connection string
- `PORT` — backend port (default `5000`)
- `CORS_ORIGIN` — allowed frontend origin (default `http://localhost:5173`)