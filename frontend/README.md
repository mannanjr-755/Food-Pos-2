# Frontend — Food POS

React.js + Tailwind CSS client for the Restaurant Food POS system.

## Structure

```
src/
├── assets/        # Images, fonts, static media
├── components/    # Reusable UI, common, and layout components
├── features/      # Domain feature modules (POS, orders, menu, etc.)
├── hooks/         # Shared React hooks
├── layouts/       # App shell layouts
├── pages/         # Route-level page containers
├── routes/        # Route definitions
├── services/      # API client & HTTP services
├── store/         # Global state
├── contexts/      # React contexts
├── utils/         # Shared utilities
├── constants/     # App-wide constants
├── styles/        # Global / Tailwind styles
└── types/         # Shared type definitions / JSDoc contracts
```

## Application

- Route-level screens cover the dashboard, POS, orders, inventory, menu,
  reports, settings, sign-in, and not-found states.
- The POS creates orders, updates inventory stock, and shares saved order data
  with the dashboard and reports.
- Demo data is stored in browser local storage. The frontend is not yet
  connected to the backend API.
- Run the development server with `npm run dev` from this directory. See the
  repository [Getting Started guide](../README.md#getting-started) for setup.
