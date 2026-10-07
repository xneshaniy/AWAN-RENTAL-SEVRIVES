-- In-app notifications for the Admin/Staff panel.
--
-- One row per EVENT, not per recipient: every Admin/Staff account shares the
-- same operational event and each user's read state lives in
-- notification_reads, so a booking that lands while three staff are online
-- creates a single row rather than three duplicates.
--
-- notifications deliberately carries only plain id references
-- (bookingId / contactMessageId) and NO foreign keys to bookings or
-- contact_messages: a notification must never block or be cascade-wiped by
-- the lifecycle of the record it points at.
--
-- Hand-written because `prisma migrate dev` cannot provision a shadow
-- database in this environment (same reason as the other additive migrations
-- in this folder). Additive only - nothing existing is altered or dropped.

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_BOOKING', 'BOOKING_STATUS_CHANGED', 'NEW_CONTACT_MESSAGE');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "bookingId" TEXT,
    "contactMessageId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("notificationId", "userId")
);

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_bookingId_idx" ON "notifications"("bookingId");

-- CreateIndex
CREATE INDEX "notifications_contactMessageId_idx" ON "notifications"("contactMessageId");

-- CreateIndex
CREATE INDEX "notification_reads_userId_idx" ON "notification_reads"("userId");

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
