# Architecture Overview

High-level layout for the Food POS system.

## Layers

1. **Frontend** (`frontend/`) — React SPA with feature-based modules and Tailwind CSS.
2. **Backend** (`backend/`) — Express API organized by domain modules.
3. **Database** — MongoDB collections owned by backend models.

## Principles

- Clear frontend / backend separation
- Domain-driven folder modules (orders, menu, POS, etc.)
- Shared utilities isolated from business domains
- Environment-driven configuration via `.env` files
- Scalable path for auth, reporting, inventory, and multi-user roles

## Next Steps

Populate placeholder files with application code in subsequent phases.
