-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'SAFEPAY';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "currency" VARCHAR(3),
ADD COLUMN     "settledBy" TEXT,
ADD COLUMN     "tracker" TEXT;

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT,
    "tracker" TEXT,
    "state" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "merchantApiKey" TEXT,
    "raw" JSONB NOT NULL,
    "paymentId" TEXT,
    "bookingId" TEXT,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_events_tracker_idx" ON "payment_events"("tracker");

-- CreateIndex
CREATE INDEX "payment_events_type_idx" ON "payment_events"("type");

-- CreateIndex
CREATE INDEX "payment_events_bookingId_idx" ON "payment_events"("bookingId");

-- CreateIndex
CREATE INDEX "payment_events_createdAt_idx" ON "payment_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tracker_key" ON "payments"("tracker");
