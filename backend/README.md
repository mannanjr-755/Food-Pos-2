# Backend — Chaska Koyla Karahi POS

Node.js + Express + MongoDB API for the standalone POS. It owns its own database and its own
staff logins; the Chaska Koyla Karahi website and its admin panel are a separate stack
(Next.js + Neon Postgres) that this service neither calls nor shares data with.

Full endpoint contract: [`docs/api/foodpos-contract.md`](../docs/api/foodpos-contract.md).

## Run

```sh
npm install
cp .env.example .env   # set MONGODB_URI and JWT_SECRET
npm run dev            # boots on :5000, seeds staff/menu/tables into an empty database
```

Development only: if `MONGODB_URI` is unreachable the server starts an in-memory MongoDB
replica set, so the data disappears on restart. In production the same failure aborts boot —
a POS must never run against a throwaway database.

Once `frontend/dist` exists, this server also serves the POS SPA at `/` and the guest table
menu at `/t/<number>`, which is what a single-host deployment (Render) relies on.

## Key env vars

| Var | Purpose |
|---|---|
| `MONGODB_URI` | The POS's own database (required in production) |
| `JWT_SECRET` | Staff session tokens — required in production, tokens would be forgeable without it |
| `CORS_ORIGIN` | Comma-separated list of UI origins allowed to call the API |
| `UPLOAD_DIR` | Where menu photos uploaded from the Menu page are written (needs a persistent disk) |
| `CLIENT_DIR` | Override for the built SPA directory; defaults to `../frontend/dist` |
| `AUTO_SEED` | Defaults to on outside production: creates demo staff, the menu and 3 tables when those collections are empty |
| `SEED_DEMO_ORDERS` | `true` also seeds demo QR orders on the floor tables |

## The table QR menu

Each floor table has a link such as `/t/2`. A guest opens it, builds a cart and posts it here:

```json
{
  "tableNumber": 2,
  "customer": { "name": "Ali Khan", "phone": "+92 300 1234567" },
  "items": [{ "productId": "<mongo id>", "quantity": 2 }],
  "notes": "extra ginger",
  "sourceRef": "client-generated-unique-key"
}
```

`sourceRef` is the idempotency key — resubmitting returns the existing order instead of
printing a second ticket. Totals, availability and the tax rate are recomputed server-side;
the guest payload never carries a price. Orders land as `pending` in the Online Orders queue
and only staff can accept or reject them.

Pausing online ordering is `PUT /api/v1/settings` with `{ "qrOrdersActive": false }` — the
guest page then reads "ordering closed" instead of accepting tickets.

## Importing the old website data (one-off)

`scripts/migrate-website-data.mjs` copies the live karahi operation out of the website's Postgres
into this POS's Mongo database: settings, active categories, products (with their menu photos into
`public/products/`), floor tables, staff, customers and order history. It is a separate command, not
part of boot, and `pg` is only a devDependency because of it.

```sh
# read-only report of what would change
npm run migrate:website -- --source-env=F:/Websites/Food-Web/.env

# same command with --apply writes; add --replace to clear this database's own catalogue first
MONGODB_URI="mongodb://127.0.0.1:27017/food_pos" npm run migrate:website -- --source-env=F:/Websites/Food-Web/.env --replace --apply
```

Notes that matter before running it:

- `MONGODB_URI` must be passed explicitly — the script refuses the in-memory development fallback.
- Re-runs are safe: categories match by name, products by `sku` then unique name, tables by number,
  staff by email, orders by `sourceRef = website:<postgres id>`.
- Password hashes are copied verbatim (raw insert, so the pre-save hook cannot double-hash them) and
  never printed; customer names and phones are counted, not logged.
- Orders default to those whose lines reference the imported menu. The website's other tickets belong
  to the pre-rebrand coffee catalogue, so `--include-all-orders` is the override, not the default.
- Tax rate is deliberately not imported: the website quoted prices tax-inclusive, the POS adds tax
  per order, so the imported totals read as the website calculated them.
- `--replace` clears this database's own categories, products, tables, customers, orders, stock
  movements and notifications first, because a different catalogue matches none of the imported
  names and would otherwise sit alongside it. Before clearing, every collection is dumped to
  `backend/backups/<database>-<timestamp>/<collection>.json`; that folder is gitignored since it
  holds customer names and phone numbers. Staff accounts are never cleared — the terminal must keep
  a way to sign in.

The 2026-10-28 run against the local `food_pos` database cleared the pre-rebrand Loop Coffee set
(5 categories, 14 products, 22 orders, 20 stock movements) into
`backend/backups/food_pos-2026-10-28T11-44-34-555Z/`, then imported 6 categories, 30 products with
their photos, 3 floor tables, 1 staff login, 40 customers and 7 orders.
