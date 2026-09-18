const fs = require('fs');
const path = require('path');

const DEST_DB = '/tmp/foodpos.db';

const candidates = [
  path.join('/app', 'prisma', 'prod.db'),
  path.join(process.cwd(), 'prisma', 'prod.db'),
  path.join(__dirname, 'prisma', 'prod.db'),
];
const src = candidates.find((p) => fs.existsSync(p));

if (!fs.existsSync(DEST_DB) && src) {
  fs.copyFileSync(src, DEST_DB);
}
if (!src) {
  console.error('prod.db not found in container; DB endpoints will fail.');
}

process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${DEST_DB}`;

const backend = require('./dist/app');
const app = backend.default || backend;

const port = Number(process.env.PORT) || 80;
app.listen(port, () => {
  console.log(`FoodPOS backend listening on port ${port}`);
});