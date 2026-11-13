# Chaska Koyla Karahi — Food POS

A standalone restaurant point-of-sale: React/Tailwind terminal, Express/MongoDB API, its own staff
logins and its own database. It runs one process that serves the POS at `/`, the guest table menu at
`/t/<number>` and the API at `/api/v1`.

The Chaska Koyla Karahi website and its admin panel (Next.js + Drizzle + Neon Postgres) are a
**separate stack**. This POS neither calls it nor shares its database, and that stack has no link
into this one. The only connection between the two is the one-off import script described below,
which is run manually and copies data out of Postgres into this POS's Mongo database.

## Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 18 + Vite 5 + Tailwind 3 (two entries: POS, guest menu) |
| Backend  | Node.js + Express 4, JWT staff sessions, SSE realtime |
| Database | MongoDB — owned by this POS only (`MONGODB_URI`)     |

## Project Structure

```
Food-Pos/
├── frontend/          # POS SPA + guest table menu (one Vite build, two entries)
├── backend/           # Express API; also serves the built SPA
├── docs/              # Architecture & API documentation
└── render.yaml        # Render blueprint for the hosted deployment
```

## Domains

- **POS** — Point-of-sale terminal flows
- **Orders** — Order lifecycle & kitchen status
- **Products / Menu** — Catalog & category management
- **Tables** — Floor plan & table status
- **Customers** — Guest profiles & history
- **Payments** — Tender types & settlements
- **Inventory** — Stock & deduction ledger
- **Users / Auth** — Staff accounts & role-based access
- **Settings** — Restaurant & system configuration
- **Dashboard** — Operational overview

## Getting Started

```sh
# API + built client on :5000 (seeds staff/menu/tables into an empty database)
cd backend && npm install && cp .env.example .env && npm run dev

# POS UI with hot reload on :5173, proxying /api to the Express server
cd frontend && npm install && npm run dev
```

`npm --prefix frontend run build` writes `frontend/dist`, which the Express process then serves.
Full endpoint contract: [docs/api/foodpos-contract.md](./docs/api/foodpos-contract.md).

## Importing the previous website data

Optional and one-off — see [backend/README.md](./backend/README.md#importing-the-old-website-data-one-off).
It copies the live karahi menu, tables, staff, customers and order history out of the website's
Postgres into this POS's Mongo database, and it refuses to run without an explicit `MONGODB_URI`.

## Deploying

`render.yaml` describes the hosted setup: one Render web service (Node 20, build the frontend,
install backend production deps, start `backend/src/server.js`) plus a persistent disk mounted at
`backend/uploads` for menu photos. The database is a MongoDB Atlas cluster of your own — its SRV
connection string goes in the `MONGODB_URI` environment variable. Step by step:
[docs/deployment.md](./docs/deployment.md).

## Conventions

- Backend modules live under `backend/src/modules/<domain>/`
- Frontend features live under `frontend/src/features/<domain>/`
- Shared helpers live under `*/shared` or `*/utils`
- Keep domain logic isolated for scalability

## License

Private — All rights reserved.
