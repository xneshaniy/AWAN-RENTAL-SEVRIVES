'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, BookingInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Car, Calendar, Clock, MapPin, User, Mail, Phone, MessageCircle, Luggage, Plane, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createBooking } from '@/actions/booking';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

interface BookingFormVehicle {
  id: string;
  name: string;
}

interface BookingFormProps {
  vehicleId?: string;
  vehicleName?: string;
  rentalType?: 'SELF_DRIVE' | 'CHAUFFEUR' | 'AIRPORT_TRANSFER' | 'CORPORATE' | 'OTHER';
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  returnDate?: string;
  /** Vehicles for the Vehicle dropdown when no `vehicleId` is preselected. */
  vehicles?: BookingFormVehicle[];
  /** Called after a booking is created successfully. When provided, replaces the built-in success screen. */
  onSuccess?: (data: { bookingNumber: string; whatsappUrl: string | null }) => void;
}

const RENTAL_TYPES = [
  { value: 'SELF_DRIVE', label: 'Self Drive', description: 'Drive the vehicle yourself' },
  { value: 'CHAUFFEUR', label: 'With Driver', description: 'Professional chauffeur included' },
  { value: 'AIRPORT_TRANSFER', label: 'Airport Transfer', description: 'Airport pickup and drop-off' },
  { value: 'CORPORATE', label: 'Corporate', description: 'Business transportation services' },
  { value: 'OTHER', label: 'Other', description: 'Custom rental requirements' },
];

function toLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * One idempotency key per submission attempt. Sent with the payload and
 * stored (unique) on the booking, so a double-click or network retry returns
 * the already-created booking instead of duplicating it.
 */
function createSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122-shaped fallback (uniqueness only needs to be per-form-instance).
  const hex = '0123456789abcdef';
  const rnd = (length: number) =>
    Array.from({ length }, () => hex[Math.floor(Math.random() * hex.length)]).join('');
  return `${rnd(8)}-${rnd(4)}-4${rnd(3)}-a${rnd(3)}-${rnd(12)}`;
}

export function BookingForm({
  vehicleId,
  vehicleName,
  rentalType = 'SELF_DRIVE',
  pickupLocation,
  dropoffLocation,
  pickupDate,
  returnDate,
  vehicles,
  onSuccess,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string>(() => createSubmissionId());
  const [submittedData, setSubmittedData] = useState<{ bookingNumber: string; whatsappUrl: string | null } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleId: vehicleId || '',
      rentalType,
      pickupLocation: pickupLocation || '',
      dropoffLocation: dropoffLocation || '',
      // Always start from a valid (future) date, computed in local time.
      pickupDate: pickupDate || toLocalDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      pickupTime: '09:00',
      returnDate: returnDate || toLocalDate(new Date(Date.now() + 48 * 60 * 60 * 1000)),
      returnTime: '09:00',
      flightNumber: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerWhatsApp: '',
      passengers: 1,
      luggage: 0,
      specialRequests: '',
      honeypot: '',
    },
  });

  const minPickupDate = toLocalDate(new Date());

  const onSubmit = async (data: BookingInput) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      // Belt-and-suspenders: read the honeypot straight from the DOM too, in
      // case a bot set .value without dispatching events (react-hook-form
      // only tracks event-driven changes). Either source being non-empty is
      // enough for the server-side spam check to reject the submission.
      const domHoneypot =
        document.querySelector<HTMLInputElement>('form [name="honeypot"]')?.value || '';

      const result = await createBooking({
        ...data,
        honeypot: data.honeypot || domHoneypot,
        submissionId,
      });

      if (result.success) {
        const successData = {
          bookingNumber: result.bookingNumber!,
          whatsappUrl: result.whatsappUrl ?? null,
        };
        // The key is consumed - the next submission is a new request.
        setSubmissionId(createSubmissionId());
        toast.success('Booking request submitted successfully!');
        if (onSuccess) {
          onSuccess(successData);
        } else {
          setSubmittedData(successData);
        }
      } else {
        const message = result.fieldErrors
          ? 'Please review the highlighted fields and try again.'
          : result.error || 'Failed to submit booking';
        setServerError(message);
        toast.error(message);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              setError(field as keyof BookingInput, { type: 'server', message: messages[0] });
            }
          });
        }
      }
    } catch {
      const message = 'An unexpected error occurred. Please try again.';
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card variant="elevated" padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-2">
              Booking Request Received
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for contacting Awan Rental Service. We have received your booking request.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                Booking Reference:{' '}
                <span className="text-primary-600 dark:text-primary-400">{submittedData.bookingNumber}</span>
              </p>
              <p className="font-medium text-gray-900 dark:text-white mt-2">
                Status:{' '}
                <span className="text-primary-600 dark:text-primary-400">Pending</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                We&apos;ll review your request and contact you to confirm availability.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <WhatsAppButton
                url={submittedData.whatsappUrl}
                size="lg"
                label="Send Details on WhatsApp"
                ariaLabel={`Send booking ${submittedData.bookingNumber} details on WhatsApp`}
              />
              <Button variant="outline" size="lg" onClick={() => setSubmittedData(null)}>
                Make Another Booking
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-6 h-6 text-primary-600" aria-hidden="true" />
          Vehicle Booking Request
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          Fill in your details below. Our team will confirm availability and contact you shortly.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate aria-busy={isSubmitting}>
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
            >
              <AlertTriangle className="mt-0.5 w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Honeypot - visually hidden from real users. Must NOT be type="hidden":
              React never fires onChange for hidden inputs, so react-hook-form would
              never see the bot's value and the server-side spam check would pass. */}
          <input
            type="text"
            {...register('honeypot')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <fieldset disabled={isSubmitting} className="m-0 border-0 p-0 min-w-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  Customer Information
                </h3>
              </div>
              <Input
                {...register('customerName')}
                label="Full Name"
                placeholder="Enter your full name"
                error={errors.customerName?.message}
                required
                icon={<User className="w-5 h-5" />}
              />
              <Input
                {...register('customerEmail')}
                type="email"
                label="Email Address"
                placeholder="your@email.com"
                error={errors.customerEmail?.message}
                required
                icon={<Mail className="w-5 h-5" />}
              />
              <Input
                {...register('customerPhone')}
                type="tel"
                label="Phone Number"
                placeholder="+92 3XX XXXXXXX"
                error={errors.customerPhone?.message}
                required
                icon={<Phone className="w-5 h-5" />}
              />
              <Input
                {...register('customerWhatsApp')}
                type="tel"
                label="WhatsApp Number (Optional)"
                placeholder="+92 3XX XXXXXXX"
                error={errors.customerWhatsApp?.message}
                icon={<MessageCircle className="w-5 h-5 text-green-600" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  Rental Details
                </h3>
              </div>

              <Select
                {...register('rentalType')}
                label="Rental Type"
                error={errors.rentalType?.message}
                required
                options={RENTAL_TYPES.map(t => ({ value: t.value, label: t.label }))}
                placeholder="Select rental type"
              />

              {vehicleId ? (
                <>
                  <Input {...register('vehicleId')} type="hidden" disabled />
                  {vehicleName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Selected Vehicle
                      </label>
                      <div className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center gap-3 h-[46px]">
                        <Car className="w-5 h-5 text-primary-600" aria-hidden="true" />
                        <span className="font-medium text-gray-900 dark:text-white">{vehicleName}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Select
                    {...register('vehicleId')}
                    label="Vehicle"
                    required
                    options={(vehicles ?? []).map(v => ({ value: v.id, label: v.name }))}
                    placeholder={
                      vehicles && vehicles.length > 0
                        ? 'Select a vehicle'
                        : 'No vehicles available'
                    }
                    disabled={!vehicles || vehicles.length === 0}
                    error={errors.vehicleId?.message}
                  />
                  {(!vehicles || vehicles.length === 0) && (
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                      No vehicles are available for online booking right now. Please contact us
                      directly.
                    </p>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  Pickup &amp; Drop-off
                </h3>
              </div>

              <Input
                {...register('pickupLocation')}
                label="Pickup Location"
                placeholder="e.g., Islamabad International Airport, Hotel Name, Address"
                error={errors.pickupLocation?.message}
                required
                icon={<MapPin className="w-5 h-5" />}
              />
              <Input
                {...register('dropoffLocation')}
                label="Drop-off Location"
                placeholder="e.g., Lahore, Hotel Name, Address"
                error={errors.dropoffLocation?.message}
                required
                icon={<MapPin className="w-5 h-5" />}
              />

              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  Date &amp; Time
                </h3>
              </div>

              <Input
                {...register('pickupDate')}
                type="date"
                label="Pickup Date"
                min={minPickupDate}
                error={errors.pickupDate?.message}
                required
                icon={<Calendar className="w-5 h-5" />}
              />
              <Input
                {...register('pickupTime')}
                type="time"
                label="Pickup Time"
                error={errors.pickupTime?.message}
                required
                icon={<Clock className="w-5 h-5" />}
              />
              <Input
                {...register('returnDate')}
                type="date"
                label="Return Date"
                min={minPickupDate}
                error={errors.returnDate?.message}
                required
                icon={<Calendar className="w-5 h-5" />}
              />
              <Input
                {...register('returnTime')}
                type="time"
                label="Return Time"
                error={errors.returnTime?.message}
                required
                icon={<Clock className="w-5 h-5" />}
              />

              <Input
                {...register('flightNumber')}
                label="Flight Number (Optional)"
                placeholder="e.g., PK301, QR622"
                error={errors.flightNumber?.message}
                icon={<Plane className="w-5 h-5" />}
              />

              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  Additional Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    {...register('passengers', { valueAsNumber: true })}
                    label="Passengers"
                    error={errors.passengers?.message}
                    required
                    options={Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                    placeholder="Select passengers"
                  />
                  <Select
                    {...register('luggage', { valueAsNumber: true })}
                    label="Luggage"
                    error={errors.luggage?.message}
                    options={Array.from({ length: 21 }, (_, i) => ({ value: String(i), label: String(i) }))}
                    placeholder="Select luggage"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Textarea
                  {...register('specialRequests')}
                  label="Special Requests (Optional)"
                  placeholder="Any special requirements, child seats, accessibility needs, etc."
                  rows={3}
                  error={errors.specialRequests?.message}
                />
              </div>
            </div>
          </fieldset>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
            </Button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              We&apos;ll contact you via WhatsApp/phone to confirm your booking.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
