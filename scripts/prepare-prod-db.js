'use strict';

// Prepares the production SQLite database on the Vercel build machine:
// 1. Generates the Prisma client (into backend/node_modules/.prisma)
// 2. Pushes the schema to a fresh `prod.db`
// 3. Seeds `prod.db` with the starter data
// The resulting `backend/prisma/prod.db` is shipped to the serverless
// function via vercel.json `functions.includeFiles`.

const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
const dbPath = path.join(backendDir, 'prisma', 'prod.db').replace(/\\/g, '/');

const env = {
  ...process.env,
  DATABASE_URL: `file:${dbPath}`,
};

function run(command, args, label) {
  console.log(`[prepare-prod-db] ${label}...`);
  const result = spawnSync(command, args, {
    cwd: backendDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`[prepare-prod-db] FAILED: ${label}`);
    process.exit(result.status === null ? 1 : result.status);
  }
}

run('npx', ['prisma', 'generate'], 'Generating Prisma client');
run('npx', ['prisma', 'db', 'push', '--skip-generate'], 'Pushing schema to prod.db');
run('npx', ['ts-node', 'prisma/seed.ts'], 'Seeding prod.db');

console.log('[prepare-prod-db] Done.');