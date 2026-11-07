'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, BookingInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  MessageCircle,
  Luggage,
  Plane,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createBooking } from '@/actions/booking';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { DepositOffer } from '@/components/booking/DepositOffer';

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
  vehicles?: BookingFormVehicle[];
  onSuccess?: (data: { bookingNumber: string; whatsappUrl: string | null }) => void;
}

const RENTAL_TYPES = [
  { value: 'SELF_DRIVE', label: 'Self Drive', description: 'Drive the vehicle yourself' },
  { value: 'CHAUFFEUR', label: 'With Driver', description: 'Professional chauffeur included' },
  { value: 'AIRPORT_TRANSFER', label: 'Airport Transfer', description: 'Airport pickup and drop-off' },
  { value: 'CORPORATE', label: 'Corporate', description: 'Business transportation services' },
  { value: 'OTHER', label: 'Other', description: 'Custom rental requirements' },
];

const BOOKING_STEPS = [
  { id: 'vehicle', label: 'Vehicle', icon: Car },
  { id: 'details', label: 'Details', icon: MapPin },
  { id: 'customer', label: 'Customer Info', icon: User },
  { id: 'summary', label: 'Summary', icon: CheckCircle2 },
];

function toLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function createSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
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
  const [submittedData, setSubmittedData] = useState<{
    bookingNumber: string;
    whatsappUrl: string | null;
    deposit?: { depositPaisa: number; rule: string; token: string } | null;
  } | null>(null);
  const [activeStep, setActiveStep] = useState('vehicle');

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
          deposit: result.deposit ?? null,
        };
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
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-success-pop">
            <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
            Booking Request Received
          </h2>
          <p className="text-muted-foreground mb-6">
            Thank you for contacting Awan Rental Service. We have received your booking request.
          </p>
          <div className="bg-secondary-50 dark:bg-secondary-900/30 rounded-xl p-4 mb-6 text-left">
            <p className="font-medium text-foreground">
              Booking Reference:{' '}
              <span className="text-primary font-bold">{submittedData.bookingNumber}</span>
            </p>
            <p className="font-medium text-foreground mt-2">
              Status:{' '}
              <Badge variant="success">Pending</Badge>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              We&apos;ll review your request and contact you to confirm availability.
            </p>
          </div>

          {submittedData.deposit?.token && (
            <DepositOffer
              bookingNumber={submittedData.bookingNumber}
              token={submittedData.deposit.token}
              depositPaisa={submittedData.deposit.depositPaisa}
              rule={submittedData.deposit.rule}
            />
          )}

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
          <p className="mt-4 text-sm text-muted-foreground">
            <Link
              href={`/booking/success/${encodeURIComponent(submittedData.bookingNumber)}`}
              className="underline underline-offset-4 hover:text-primary transition-colors"
            >
              View your booking receipt
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Progress Indicator */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">
            Vehicle Booking Request
          </h2>
          <p className="text-muted-foreground">
            Fill in your details below. Our team will confirm availability and contact you shortly.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-8">
        {/* Step Indicator */}
        <div className="hidden lg:flex flex-col gap-4 w-20">
          {BOOKING_STEPS.map((step, index) => {
            const isActive = activeStep === step.id;
            const isCompleted =
              (step.id === 'vehicle' && vehicleId) ||
              (step.id === 'details' && activeStep !== 'vehicle') ||
              (step.id === 'customer' && activeStep === 'summary');
            return (
              <div key={step.id} className="flex items-center gap-3 relative">
                {index < BOOKING_STEPS.length - 1 && (
                  <div className="absolute -top-6 left-10 w-px h-8 -mt-12 bg-primary/20" aria-hidden="true" />
                )}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : isCompleted
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card text-muted-foreground border border-border'
                  )}
                >
                  {isActive || isCompleted ? (
                    <step.icon className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium leading-tight text-center w-12',
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <Card variant="elevated" padding="lg" className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                {activeStep === 'vehicle' && <Car className="w-6 h-6 text-primary" aria-hidden="true" />}
                {activeStep === 'details' && <MapPin className="w-6 h-6 text-primary" aria-hidden="true" />}
                {activeStep === 'customer' && <User className="w-6 h-6 text-primary" aria-hidden="true" />}
                {activeStep === 'summary' && <CheckCircle2 className="w-6 h-6 text-primary" aria-hidden="true" />}
                <CardTitle className="flex items-center gap-2">
                  {activeStep === 'vehicle' && <span>Vehicle Selection</span>}
                  {activeStep === 'details' && <span>Pickup &amp; Dates</span>}
                  {activeStep === 'customer' && <span>Customer Information</span>}
                  {activeStep === 'summary' && <span>Booking Summary</span>}
                </CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">
                {activeStep === 'vehicle' && 'Choose your preferred vehicle and rental type.'}
                {activeStep === 'details' && 'Set your pickup location, dates, and times.'}
                {activeStep === 'customer' && 'Provide your contact information for confirmation.'}
                {activeStep === 'summary' && 'Review your booking details before submitting.'}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate aria-busy={isSubmitting}>
                {serverError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    <AlertTriangle className="mt-0.5 w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Honeypot */}
                <input
                  type="text"
                  {...register('honeypot')}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <fieldset disabled={isSubmitting} className="m-0 border-0 p-0 min-w-0 space-y-6">
                  {/* Step 1: Vehicle Selection (always shown, collapsible visually) */}
                  <section
                    className={cn(
                      'space-y-4',
                      activeStep !== 'vehicle' ? 'max-h-0 opacity-0 overflow-hidden transition-all duration-300' : ''
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Car className="w-5 h-5 text-primary" aria-hidden="true" />
                          Rental Details
                        </h3>
                      </div>

                      <Select
                        {...register('rentalType')}
                        label="Rental Type"
                        error={errors.rentalType?.message}
                        required
                        options={RENTAL_TYPES.map((t) => ({ value: t.value, label: t.label, description: t.description }))}
                        placeholder="Select rental type"
                      />

                      {vehicleId ? (
                        <>
                          <input {...register('vehicleId')} type="hidden" disabled />
                          {vehicleName && (
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1.5">
                                Selected Vehicle
                              </label>
                              <div className="px-4 py-3 rounded-lg border border-border bg-secondary-50 dark:bg-secondary-800/50 flex items-center gap-3 h-[56px]">
                                <Car className="w-5 h-5 text-primary" aria-hidden="true" />
                                <span className="font-medium text-foreground">{vehicleName}</span>
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
                            options={(vehicles ?? []).map((v) => ({ value: v.id, label: v.name }))}
                            placeholder={
                              vehicles && vehicles.length > 0
                                ? 'Select a vehicle'
                                : 'No vehicles available'
                            }
                            disabled={!vehicles || vehicles.length === 0}
                            error={errors.vehicleId?.message}
                          />
                          {(!vehicles || vehicles.length === 0) && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              No vehicles are available for online booking right now. Please contact us
                              directly.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Step 2: Pickup & Drop-off Details */}
                  <section
                    className={cn(
                      'space-y-4',
                      activeStep !== 'details' ? 'max-h-0 opacity-0 overflow-hidden transition-all duration-300' : ''
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
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
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
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
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Luggage className="w-5 h-5 text-primary" aria-hidden="true" />
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
                  </section>

                  {/* Step 3: Customer Information */}
                  <section
                    className={cn(
                      'space-y-4',
                      activeStep !== 'customer' ? 'max-h-0 opacity-0 overflow-hidden transition-all duration-300' : ''
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" aria-hidden="true" />
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
                        icon={<MessageCircle className="w-5 h-5 text-accent" />}
                      />
                    </div>
                  </section>

                  {/* Step 4: Summary (readonly preview before submit) */}
                  <section
                    className={cn(
                      'space-y-4',
                      activeStep !== 'summary' ? 'max-h-0 opacity-0 overflow-hidden transition-all duration-300' : ''
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                          Booking Summary
                        </h3>
                      </div>
                      <div className="bg-secondary-50 dark:bg-secondary-900/30 rounded-xl p-6 md:col-span-2">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">Vehicle</span>
                            <span className="text-foreground font-medium">{vehicleName || 'Selected vehicle'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">Rental Type</span>
                            <span className="text-foreground font-medium">
                              {RENTAL_TYPES.find((t) => t.value === rentalType)?.label || rentalType}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">Pickup Location</span>
                            <span className="text-foreground font-medium">{pickupLocation || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">Drop-off Location</span>
                            <span className="text-foreground font-medium">{dropoffLocation || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">Pickup Date &amp; Time</span>
                            <span className="text-foreground font-medium">
                              {pickupDate || '—'} at {pickupTime || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">Return Date &amp; Time</span>
                            <span className="text-foreground font-medium">
                              {returnDate || '—'} at {returnTime || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Passengers</span>
                            <span className="text-foreground font-medium">
                              {(typeof passengers === 'number' ? passengers : parseInt(passengers)) || 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </fieldset>

                {/* Step Navigation */}
                <div className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center">
                    {activeStep !== 'vehicle' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentIndex = BOOKING_STEPS.findIndex((s) => s.id === activeStep);
                          setActiveStep(BOOKING_STEPS[currentIndex - 1].id);
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" aria-hidden="true" />
                        Previous
                      </Button>
                    )}
                    <div className="flex-1 px-4">
                      <Badge variant={activeStep === 'summary' ? 'gold' : 'primary'}>
                        Step {BOOKING_STEPS.findIndex((s) => s.id === activeStep) + 1} of {BOOKING_STEPS.length}
                      </Badge>
                    </div>
                    {activeStep !== 'summary' ? (
                      <Button
                        type="button"
                        variant="primary"
                        disabled={isSubmitting}
                        onClick={() => {
                          const currentIndex = BOOKING_STEPS.findIndex((s) => s.id === activeStep);
                          setActiveStep(BOOKING_STEPS[currentIndex + 1].id);
                        }}
                      >
                        Next <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        variant="gold"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                      </Button>
                    )}
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    We&apos;ll contact you via WhatsApp/phone to confirm your booking.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


