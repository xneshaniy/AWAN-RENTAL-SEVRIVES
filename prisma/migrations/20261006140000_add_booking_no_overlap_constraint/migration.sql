-- Database-level protection against double-booking the same vehicle.
--
-- The application already rejects overlapping ranges inside a locked
-- transaction (see src/lib/availability.ts and the FOR UPDATE in
-- src/lib/booking.ts). This constraint is the last line of defence: even a
-- future code path that forgets the availability check cannot write two
-- conflicting bookings.
--
-- Scope matches BLOCKING_BOOKING_STATUSES exactly - CONFIRMED, ACTIVE,
-- COMPLETED and NO_SHOW always hold their dates. PENDING is deliberately
-- excluded because a pending booking only holds its range while the
-- configurable hold window is active (and CANCELLED frees the vehicle), so
-- including them here would make the database stricter than the product rules.
--
-- Bounds are inclusive ('[]') to mirror rangesOverlap(), which treats a
-- same-day turnaround (return 18:00, next pickup 18:00) as a conflict.
--
-- btree_gist supplies the GiST operator class for the text equality on
-- vehicleId; tsrange overlap support is built into PostgreSQL core.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "vehicleId" WITH =,
    tsrange("startDate", "endDate", '[]') WITH &&
  )
  WHERE ("status" IN ('CONFIRMED', 'ACTIVE', 'COMPLETED', 'NO_SHOW'));
