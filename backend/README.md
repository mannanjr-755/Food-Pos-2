# Backend — Food POS

Node.js + Express.js API for the Restaurant Food POS system. MongoDB is the primary data store.

## Structure

```
src/
├── config/        # Environment & app configuration
├── middleware/    # Express middleware
├── modules/       # Domain modules (controller / service / model / routes)
├── shared/        # Cross-cutting utils, validators, errors, constants
├── database/      # Connection, migrations, seeders
├── jobs/          # Background / scheduled jobs
├── routes/        # Root API router aggregation
├── app.js         # Express app bootstrap (placeholder)
└── server.js      # HTTP server entry (placeholder)
```

## Module Pattern

Each domain under `modules/<name>/` typically includes:

- `<name>.routes.js`
- `<name>.controller.js`
- `<name>.service.js`
- `<name>.model.js` (when persistence is required)

## Notes

- No application logic is implemented yet — structure only.
- Copy `.env.example` to `.env` before running the API.
