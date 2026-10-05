/**
 * Ensures the gallery category column exists in whichever database the
 * supplied env file points at. Additive and guarded, so it is safe to run
 * repeatedly and safe against a database that already has the column.
 *
 *   node scripts/apply-image-categories-column.mjs path/to/env
 *
 * The connection string is never logged.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const envFile = process.argv[2];
if (!envFile) {
  console.error('usage: node scripts/apply-image-categories-column.mjs <env-file>');
  process.exit(1);
}

const raw = readFileSync(resolve(envFile), 'utf8');
const match = raw.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
if (!match) {
  console.error('No DATABASE_URL found in the supplied file.');
  process.exit(1);
}
process.env.DATABASE_URL = match[1].trim().replace(/^['"]|['"]$/g, '');

const prisma = new PrismaClient();

const table = await prisma.$queryRawUnsafe(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicles'`
);
if (table.length === 0) {
  console.log('vehicles table not present - nothing to do');
  process.exit(0);
}

const columns = await prisma.$queryRawUnsafe(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'vehicles'`
);
const names = columns.map((c) => c.column_name);

if (names.includes('imagecategories')) {
  console.log('column "imageCategories" already present - no change');
} else {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "vehicles" ADD COLUMN "imageCategories" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL`
  );
  console.log('column "imageCategories" added');
}

await prisma.$disconnect();
