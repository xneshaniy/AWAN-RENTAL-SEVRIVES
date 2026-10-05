-- Add an index-aligned gallery category for each photo in vehicles."images".
--
-- Written by hand because `prisma migrate dev` could not provision a shadow
-- database (the local role has no CREATEDB). The statement matches what
-- Prisma generates for `imageCategories String[] @default([])` on PostgreSQL.
--
-- Additive only: existing rows are backfilled with an empty array, which the
-- gallery reads as "no categories assigned" and renders exactly as before.

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "imageCategories" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
