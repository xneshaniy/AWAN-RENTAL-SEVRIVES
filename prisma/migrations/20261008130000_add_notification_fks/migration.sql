-- Link notifications to the records they announce.
--
-- The first notifications migration deliberately used bare id columns with no
-- foreign keys. It turned out that BOTH bookings and contact messages are
-- deleted through authorized admin endpoints (DELETE /api/bookings/[id] and
-- the message delete action), which would leave a bell entry pointing at a
-- record that no longer exists - a "View" link that 404s.
--
-- ON DELETE CASCADE makes the notification die with its subject. Unlike
-- RESTRICT it can never block a deletion, and unlike SET NULL it cannot leave
-- a notification whose whole purpose has disappeared.
--
-- Additive only: two foreign keys are added to `notifications`. Neither
-- `bookings` nor `contact_messages` is altered - the constraint lives on the
-- notifications table, so existing booking rows are untouched.

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_contactMessageId_fkey"
    FOREIGN KEY ("contactMessageId") REFERENCES "contact_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
