# Food POS — Restaurant Point of Sale System

Production-ready monorepo structure for a restaurant Food POS application.

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React.js + Tailwind CSS |
| Backend  | Node.js + Express.js    |
| Database | MongoDB                 |

## Project Structure

```
Food-Pos/
├── frontend/          # React + Tailwind client
├── backend/           # Node.js + Express API
└── docs/              # Architecture & API documentation
```

## Domains

- **POS** — Point-of-sale terminal flows
- **Orders** — Order lifecycle & kitchen status
- **Products / Menu** — Catalog & category management
- **Tables** — Floor plan & table status
- **Customers** — Guest profiles & history
- **Payments** — Tender types & settlements
- **Inventory** — Stock & ingredient tracking
- **Reports** — Sales, inventory & operational analytics
- **Users / Auth** — Authentication & role-based access
- **Settings** — Restaurant & system configuration
- **Dashboard** — Operational overview

## Getting Started

> Application code, dependencies, and runtime setup will be added in later phases.

1. Copy environment examples:
   - `frontend/.env.example` → `frontend/.env`
   - `backend/.env.example` → `backend/.env`
2. Install packages in `frontend/` and `backend/` when ready.
3. Start MongoDB, then run backend and frontend servers.

## Conventions

- Frontend features live under `frontend/src/features/<domain>/`
- Backend modules live under `backend/src/modules/<domain>/`
- Shared helpers live under `*/shared` or `*/utils`
- Keep domain logic isolated for scalability

## License

Private — All rights reserved.
