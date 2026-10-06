-- Add a video URL list to each vehicle so the site-wide gallery page can
-- show clips alongside photos.
--
-- Written by hand because `prisma migrate dev` could not provision a shadow
-- database (the local role has no CREATEDB), exactly like the
-- 20261006120000_add_vehicle_image_categories migration above. The statement
-- matches what Prisma generates for `videos String[] @default([])` on
-- PostgreSQL.
--
-- Additive only: every existing row gets an empty array, which the gallery
-- reads as "this vehicle has no videos yet" and renders exactly as before.
-- No row, price or image is touched.

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "videos" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
