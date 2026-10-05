-- Refundable security deposit per vehicle.
--
-- Additive and nullable: every existing row (including all demo vehicles) gets
-- NULL, which the application reads as "no deposit required", so no demo price
-- or vehicle data changes.
ALTER TABLE "vehicles" ADD COLUMN "deposit" DECIMAL(10,2);
