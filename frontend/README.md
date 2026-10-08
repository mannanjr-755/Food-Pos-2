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

## Notes

- Feature folders map 1:1 to product domains.
- No application logic is implemented yet — structure only.
