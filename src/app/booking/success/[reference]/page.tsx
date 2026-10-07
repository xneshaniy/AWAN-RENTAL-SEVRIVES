import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, CreditCard, XCircle } from 'lucide-react';
import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getBookingReceipt, normalizeBookingReference, type BookingReceipt } from '@/lib/booking';
import { getDepositOffer, type DepositOffer as DepositOfferInfo } from '@/lib/deposit';
import {
  confirmSafePayDepositReturn,
  type DepositReturnResult,
} from '@/lib/safepay-settlement';
import { DepositOffer } from '@/components/booking/DepositOffer';
import { getBookingWhatsAppMessage, rentalTypeLabel } from '@/lib/whatsapp';
import { formatDate } from '@/lib/utils';

// Receipts contain customer details — never index or follow them.
export const metadata: Metadata = {
  title: 'Booking Request Received',
  robots: { index: false, follow: false },
};

interface BookingSuccessPageProps {
  params: { reference: string };
  /**
   * SafePay appends `?tracker=...` when it sends the shopper back, and the
   * cancel URL carries `?deposit=cancelled`. Reading searchParams keeps this
   * route dynamic, which it must be - the receipt is never cached or indexed.
   */
  searchParams?: { tracker?: string; deposit?: string };
}

/** One label/value row of the receipt (stacked on mobile, two columns on sm+). */
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:w-44 sm:flex-shrink-0">
        {label}
      </dt>
      <dd className="break-words text-sm font-medium text-gray-900 dark:text-white sm:text-right">
        {value}
      </dd>
    </div>
  );
}

/** Full-page state card shared by the invalid/missing/error situations. */
function StateCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12 sm:py-20" aria-labelledby="receipt-title">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            {icon}
          </div>
          <h1
            id="receipt-title"
            className="mb-3 font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
          >
            {title}
          </h1>
          <div className="mb-8 text-gray-600 dark:text-gray-400">{children}</div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild fullWidth className="sm:w-auto">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button variant="outline" size="lg" asChild fullWidth className="sm:w-auto">
              <Link href="/booking">Make a Booking</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

async function Receipt({
  booking,
  offer,
  returnResult,
  cancelled,
}: {
  booking: BookingReceipt;
  offer: DepositOfferInfo | null;
  returnResult: DepositReturnResult | null;
  cancelled: boolean;
}) {
  const whatsappMessage = await getBookingWhatsAppMessage({
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    vehicleName: booking.vehicleName,
    rentalType: booking.rentalType,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    pickupDate: formatDate(booking.startDate),
    returnDate: formatDate(booking.endDate),
    passengers: booking.passengers,
    specialRequests: booking.specialRequests,
  });

  return (
    <section className="py-12 sm:py-20" aria-labelledby="receipt-title">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Card variant="elevated" padding="lg" className="text-center animate-fade-in">
          {/* One-shot expanding ring behind a checkmark that pops into place. */}
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-green-400/40 animate-success-ring"
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-success-pop">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
          </div>
          <h1
            id="receipt-title"
            className="mb-3 animate-slide-up font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
          >
            Booking Request Received
          </h1>
          <p className="mb-2 animate-slide-up animation-delay-200 text-gray-600 dark:text-gray-400">
            Thank you for contacting Awan Rental Service. We have received your booking request.
          </p>
          <p className="mb-8 animate-slide-up animation-delay-400 text-gray-600 dark:text-gray-400">
            We will contact you on the details you provided to confirm the vehicle,
            availability and price.{' '}
            {offer?.depositPaisa
              ? 'Nothing has been charged yet - you can secure the request with the deposit below, or pay nothing now and settle up with us directly.'
              : 'Nothing has been charged.'}
          </p>

          <dl className="mb-8 divide-y divide-gray-100 px-1 text-left dark:divide-gray-700">
            <ReceiptRow label="Booking Reference" value={booking.bookingNumber} />
            <ReceiptRow label="Vehicle" value={booking.vehicleName} />
            <ReceiptRow label="Rental Type" value={rentalTypeLabel(booking.rentalType)} />
            <ReceiptRow label="Pickup" value={booking.pickupLocation} />
            <ReceiptRow label="Drop-off" value={booking.dropoffLocation} />
            <ReceiptRow
              label="Date"
              value={`${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`}
            />
            <ReceiptRow label="Customer Name" value={booking.customerName ?? 'Not provided'} />
          </dl>

          {/* Result of a checkout SafePay just sent back to us. */}
          {returnResult && (
            <div
              role="status"
              className={`mb-6 flex items-start gap-2 rounded-xl border p-4 text-left text-sm font-medium ${
                returnResult.status === 'PAID'
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300'
                  : returnResult.status === 'MISMATCH'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              {returnResult.status === 'PAID' ? (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              ) : returnResult.status === 'PENDING' ? (
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              ) : returnResult.status === 'MISMATCH' ? (
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
              <span>{returnResult.message}</span>
            </div>
          )}

          {/* Shopper backed out of hosted checkout before paying anything. */}
          {!returnResult && cancelled && (
            <div
              role="status"
              className="mb-6 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>No payment was made - you cancelled at the checkout. Your booking request is untouched.</span>
            </div>
          )}

          {/* Settled earlier (e.g. the webhook beat us to it). */}
          {!returnResult && offer?.alreadyPaid && (
            <div
              role="status"
              className="mb-6 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-left text-sm font-medium text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
            >
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>
                Your deposit has been received. The balance is paid when you collect the vehicle.
              </span>
            </div>
          )}

          {offer?.depositPaisa && offer.token && (
            <DepositOffer
              bookingNumber={booking.bookingNumber}
              token={offer.token}
              depositPaisa={offer.depositPaisa}
              rule={offer.rule}
            />
          )}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <WhatsAppButton
              message={whatsappMessage}
              size="lg"
              fullWidth
              className="sm:w-auto"
              label="Send Details on WhatsApp"
              ariaLabel={`Send booking ${booking.bookingNumber} details on WhatsApp`}
            />
            <Button size="lg" variant="outline" asChild fullWidth className="sm:w-auto">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: BookingSuccessPageProps) {
  const businessInfo = await getBusinessInfo();
  const reference = normalizeBookingReference(params.reference);
  const returnedTracker =
    typeof searchParams?.tracker === 'string' ? searchParams.tracker : null;
  const cancelledAtCheckout = searchParams?.deposit === 'cancelled';

  let content: React.ReactNode;

  if (!reference) {
    content = (
      <StateCard
        icon={<AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
        title="Invalid Booking Reference"
      >
        <p>
          The booking reference you followed is not valid. References look like{' '}
          <span className="font-mono font-medium text-gray-900 dark:text-white">ARS-XXXXXX</span>.
          Please check the link and try again.
        </p>
      </StateCard>
    );
  } else {
    // Database failures throw here and are handled by the segment's error.tsx.
    const booking = await getBookingReceipt(reference);

    if (booking) {
      // Confirm a checkout SafePay just returned BEFORE loading the offer, so
      // the same render shows the settled state when the webhook has landed.
      const returnResult = returnedTracker
        ? await confirmSafePayDepositReturn({ tracker: returnedTracker, bookingNumber: reference })
        : null;
      const offer = await getDepositOffer(reference);

      content = (
        <Receipt
          booking={booking}
          offer={offer}
          returnResult={returnResult}
          cancelled={cancelledAtCheckout}
        />
      );
    } else {
      content = (
        <StateCard
          icon={<AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
          title="Booking Not Found"
        >
          <p>
            We could not find a booking with the reference{' '}
            <span className="font-mono font-medium text-gray-900 dark:text-white">{reference}</span>.
            Please check the reference, or contact us and we will help you locate your request.
          </p>
        </StateCard>
      );
    }
  }

  return (
    <Layout businessInfo={businessInfo}>
      {content}
      <WhatsAppFloat />
    </Layout>
  );
}
