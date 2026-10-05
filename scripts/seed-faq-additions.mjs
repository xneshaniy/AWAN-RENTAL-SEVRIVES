/**
 * Inserts the two FAQ questions added for the professional-site checklist:
 *
 *   "Do I need a deposit?"   (Pricing)
 *   "Can I rent nationwide?" (Services)
 *
 * Usage:
 *   node scripts/seed-faq-additions.mjs                  # uses DATABASE_URL from the environment
 *   node scripts/seed-faq-additions.mjs path/to/env      # DATABASE_URL read from that file instead
 *
 * The connection string is never logged. Rows are created with `update: {}`
 * so any edit an admin has already made in the database is preserved.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

/** Mirrors prisma/seed.ts so a re-run and a fresh seed agree. */
const FAQS = [
  {
    id: 'faq-9',
    question: 'Do I need a deposit?',
    answer:
      'No deposit is taken through this website. There is no checkout and no card form here - payment terms, including any deposit, are agreed directly with you once we have contacted you about your request.',
    category: 'Pricing',
    order: 9,
    isActive: true,
  },
  {
    id: 'faq-10',
    question: 'Can I rent nationwide?',
    answer:
      'Yes. We arrange car rental and transportation across Pakistan. Islamabad, Rawalpindi and Lahore also have vehicle delivery and pickup. Send us your city, dates and preferred vehicle and we will confirm availability.',
    category: 'Services',
    order: 10,
    isActive: true,
  },
];

const envFile = process.argv[2];

if (envFile) {
  const raw = readFileSync(resolve(envFile), 'utf8');
  const match = raw.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
  if (!match) {
    console.error('No DATABASE_URL found in the supplied file.');
    process.exit(1);
  }
  // `vercel env pull` wraps values in single or double quotes - strip them.
  process.env.DATABASE_URL = match[1].trim().replace(/^['"]|['"]$/g, '');
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const total = await prisma.fAQ.count();
  console.log(`FAQ rows before: ${total}`);

  for (const faq of FAQS) {
    const existing = await prisma.fAQ.findUnique({ where: { id: faq.id } });
    await prisma.fAQ.upsert({ where: { id: faq.id }, update: {}, create: faq });
    console.log(`${existing ? 'kept  ' : 'added '} ${faq.id}  ${faq.question}`);
  }

  const after = await prisma.fAQ.count();
  console.log(`FAQ rows after:  ${after}`);
} finally {
  await prisma.$disconnect();
}
