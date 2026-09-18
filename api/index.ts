import fs from 'fs';
import path from 'path';
import express from 'express';
import type { PrismaClient } from '@prisma/client';

// Production lifecycle for the SQLite database inside the Vercel serverless
// runtime: Vercel functions have a read-only filesystem except `/tmp`, so a
// writable copy of the pre-seeded DB is materialized there on cold start.
const SRC_DB = path.join(process.cwd(), 'backend', 'prisma', 'prod.db');
const DEST_DB = '/tmp/dev.db';

function materializeDb(): void {
  if (!fs.existsSync(DEST_DB) && fs.existsSync(SRC_DB)) {
    fs.copyFileSync(SRC_DB, DEST_DB);
  }
}

materializeDb();
process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${DEST_DB}`;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const backend = require('../backend/dist/app.js') as {
  default: express.Express;
  prisma: PrismaClient;
};

const app = backend.default;

app.use((_req, _res, next) => {
  materializeDb();
  next();
});

export default app;