# Chaska Koyla Karahi POS — API Contract (v1)

Base URL: `/api/v1`, served by the POS's own Express + MongoDB backend.
Auth: `Authorization: Bearer <JWT>` for staff routes; `/public/*` is open to guests at a table.
All monetary values are numbers rounded to 2 decimals; the symbol comes from `GET /settings`.

This API is self-contained. It has no shared database, no shared event outbox and no
inbound key with the Chaska Koyla Karahi website or its admin panel.

## Roles

- `admin` — full management (menu, categories, inventory, order acceptance, settings, users).
- `manager` — same as admin except user management.
- `cashier` — POS sales, the online order queue, status advance (Accepted → Preparing → Ready → Served → Completed).

## Staff resources

### Auth
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | `{pin}` → `{_id,name,role,token}` (default PIN `12345` via `POS_PIN`) |
| GET | `/auth/profile` | any | current user |

### Categories
| GET | `/categories` | any auth | list with `productCount` |
| POST | `/categories` | admin/manager | `{name, description?, image?, active?, sortOrder?}` |
| PATCH | `/categories/:id` | admin/manager | partial update |
| DELETE | `/categories/:id` | admin/manager | 409 while products still reference it |

Category: `{_id, id, name, description, image, active, sortOrder, productCount}`

### Products (menu)
| GET | `/products` | any auth | filters `?category=&search=&available=&sort=name|price|-price|newest` |
| POST | `/products` | admin/manager | `{name, price, category, description?, image?, available?, popular?, sortOrder?, trackStock?, stock?, lowStockThreshold?, sku?, barcode?}` |
| PATCH | `/products/:id` | admin/manager | any subset of the above |
| DELETE | `/products/:id` | admin | blocked once the item appears on an order |
| GET | `/pos/products` | any auth | POS catalogue: active categories, available products, stock summary |

Product: `{_id, name, description, sku, barcode, category (id+name), price, image, available, popular, sortOrder, trackStock, stock, lowStockThreshold}`

### Tables (the dine-in floor)
| GET | `/tables` | any auth | `?includeInactive=true` for retired tables; includes the open order per table |
| POST | `/tables` | admin/manager | `{number 1-999, label?, seats?, isActive?}` — 409 on a duplicate number |
| PATCH | `/tables/:id` | admin/manager | `{number?, label?, seats?, isActive?}` |
| DELETE | `/tables/:id` | admin/manager | deactivates when the table has orders, deletes when it has none |
| GET | `/tables/:id/orders` | any auth | `?limit=1-50`, newest first |

Table: `{id, number, label, seats, isActive, currentOrder, totalOrders, restaurantName}`

### Orders
| GET | `/orders` | any auth | `?channel=pos|qr|online&status=&page=&limit=` — `online` = `qr` + imported `website` rows |
| GET | `/orders/:id` | any auth | full detail |
| POST | `/orders/:id/accept` | admin/manager | intake `pending` → `accepted`, deducts stock once |
| POST | `/orders/:id/reject` | admin/manager | intake `pending` → `rejected` |
| PATCH | `/orders/:id/status` | role-gated | `{status}` — validated transitions only |

Order: `{_id, orderNumber, channel (pos|qr|website), orderType (Dine In|Takeaway|Delivery), status, customer{name,phone}, items[{productId,name,image,price,quantity,lineTotal,notes}], subtotal, discount, tax, total, payment{method,status,received,change}, notes, table, tableNumber, sourceRef, acceptedAt, completedAt, createdAt}`

Status lifecycle: `pending → accepted → preparing → ready → served → completed`, with
`pending → rejected` and cancellation from any open state. POS sales are created
`completed` directly.

### POS transactions
| POST | `/pos/sales` | cashier+ | `{orderType, items[{productId,quantity,notes?}], customer?, notes?, table?, discount?, payment{method,received?}, idempotencyKey}` — server prices from the DB, validates and deducts stock, records the payment, returns order + receipt |
| POST | `/pos/hold` | cashier+ | `{orderType, items, customer?, notes?, table?}` → held ticket |
| GET | `/pos/held` | cashier+ | list held tickets |
| PATCH | `/pos/held/:id/resume` | cashier+ | returns the payload into the cart |
| DELETE | `/pos/held/:id` | cashier+ | discard |
| POST | `/pos/save` | cashier+ | unpaid draft (`pending`, channel `pos`) |

A free-text `table` is linked to a floor table when its digits match a table number, so the
floor view and the printed ticket agree.

### Images
| POST | `/images` | admin/manager | `multipart/form-data`, field `file` (png/jpeg/webp/gif, 2 MB) → `{url:"/uploads/<name>", name}` |

`GET /uploads/*` and `GET /static/products/*` are served by the same process.

### Settings, realtime, reporting
| GET | `/settings` · PUT | any auth · admin | business name, tagline, currency, taxRate, serviceFee, receipt footer, timezone, phone, address, `qrOrdersActive` |
| GET | `/dashboard` | any auth | `{totals{orders,todayOrders,totalRevenue,todayRevenue,unreadAlerts}, statusCounts{pending…cancelled}, tables{total,occupied,rows[]}, recentOrders[]}` |
| GET | `/reports` | any auth | sales history |
| GET | `/customers` | any auth | customer profiles + order summary |
| GET | `/payments` | any auth | payment rows for an order |
| GET | `/inventory` · POST `/inventory/adjust` · GET `/inventory/movements` | any auth · admin/manager | stock list, signed adjustments, ledger |
| GET | `/events/stream` | any auth (SSE) | emits `order.created`, `order.accepted`, `order.status`, `sale.completed`, `product.updated`, `category.updated`, `stock.updated`, `ping`; `Last-Event-ID` replays missed events |
| GET | `/events` · `/notifications` · POST `/notifications/read` | any auth | polling fallback and the bell |

## Guest resources (the table QR menu)

No token, rate-limited per IP (300/min menu reads, 30/min orders).

| Method | Path | Purpose |
|---|---|---|
| GET | `/public/menu?table=<number>` | `{restaurant{name,tagline,phone,currencySymbol,taxRate,ordersOpen}, table{number,label,seats}, categories[], items[]}` — items carry `popular`, `lowStock`, `soldOut` |
| POST | `/public/orders` | `{tableNumber, customer{name,phone?}, items[{productId,quantity,notes?}], notes?, sourceRef}` → 201, or 200 with `replayed:true` when `sourceRef` was already used |
| GET | `/public/orders/:id` | status poll for the guest's own order |

The guest page itself is the second entry of the Vite build: Express serves `customer.html` for
`/t/<number>`, so the POS and its QR menu ship from one process on one URL.

`sourceRef` is a client-generated key, so a retried submit never creates a second ticket.
Totals are recomputed server-side; a guest can never set a price. Placing an order is refused
with 503 while `qrOrdersActive` is false, and with 404 for a table that is not on the floor.

## Reliability rules

- Events reach the UI only through persisted `IntegrationEvent` rows (durable outbox) — the SSE
  stream and the polling fallback read the same table, and reconnect replays via `Last-Event-ID`.
- Stock is deducted inside the sale transaction; intake orders deduct at `accepted`, exactly once
  (`stockDeducted` is claimed with a conditional update).
- Every write is validated server-side; UI-only guards are not trusted.
- `MONGODB_URI` is required in production — the in-memory fallback is development-only, so a
  misconfigured deploy fails at boot instead of serving an empty database.
