import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { getBusinessInfo } from '@/lib/settings';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getBookingReceipt, normalizeBookingReference, type BookingReceipt } from '@/lib/booking';
import { getBookingWhatsAppMessage, rentalTypeLabel } from '@/lib/whatsapp';
import { formatDate } from '@/lib/utils';

// Receipts contain customer details — never index or follow them.
export const metadata: Metadata = {
  title: 'Booking Request Received',
  robots: { index: false, follow: false },
};

interface BookingSuccessPageProps {
  params: { reference: string };
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

async function Receipt({ booking }: { booking: BookingReceipt }) {
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
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h1
            id="receipt-title"
            className="mb-3 font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"
          >
            Booking Request Received
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Thank you for contacting Awan Rental Service. We have received your booking request.
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

export default async function BookingSuccessPage({ params }: BookingSuccessPageProps) {
  const businessInfo = await getBusinessInfo();
  const reference = normalizeBookingReference(params.reference);

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
    content = booking ? (
      <Receipt booking={booking} />
    ) : (
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

  return (
    <Layout businessInfo={businessInfo}>
      {content}
      <WhatsAppFloat />
    </Layout>
  );
}
