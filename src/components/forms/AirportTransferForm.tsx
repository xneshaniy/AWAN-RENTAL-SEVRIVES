'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { Input, Select } from '@/components/ui/Input';
import { airportTransferSchema } from '@/lib/validations';
import type { AirportTransferInput } from '@/lib/validations';
import { submitAirportTransferRequest } from '@/actions/airport-transfer';
import {
  getEnabledAirports,
  ALLOW_OTHER_AIRPORT,
  OTHER_AIRPORT_ID,
  VEHICLE_PREFERENCE_OPTIONS,
} from '@/config/airports';
import { generateGeneralWhatsAppMessage } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const DIRECTION_OPTIONS: { value: 'ARRIVAL' | 'DEPARTURE'; label: string }[] = [
  { value: 'ARRIVAL', label: 'Arrival (airport pickup)' },
  { value: 'DEPARTURE', label: 'Departure (airport drop-off)' },
];

function getLocalToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Airport-transfer request form.
 *
 * States: idle → submitting (spinner + disabled fields) → success panel or
 * inline/ toast error. Validation runs client-side through the shared Zod
 * schema and again inside the server action.
 */
export function AirportTransferForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<AirportTransferInput | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AirportTransferInput>({
    resolver: zodResolver(airportTransferSchema),
    defaultValues: {
      airport: '',
      direction: 'ARRIVAL',
      date: '',
      time: '',
      flightNumber: '',
      location: '',
      passengers: 1,
      luggage: 0,
      vehiclePreference: 'ANY',
      customerName: '',
      whatsapp: '',
      honeypot: '',
    },
  });

  const direction = watch('direction');

  const airportOptions = [
    ...getEnabledAirports().map((airport) => ({ value: airport.id, label: airport.label })),
    ...(ALLOW_OTHER_AIRPORT ? [{ value: OTHER_AIRPORT_ID, label: 'Other airport' }] : []),
  ];

  const onSubmit = async (data: AirportTransferInput) => {
    setServerError(null);
    try {
      const result = await submitAirportTransferRequest(data);

      if (result.success) {
        setSubmitted(data);
        reset();
        toast.success('Airport transfer request received!');
        return;
      }

      const message = result.error || 'Failed to submit your request. Please try again.';
      setServerError(message);
      toast.error(message);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof AirportTransferInput, {
              type: 'server',
              message: messages[0],
            });
          }
        }
      }
    } catch {
      const message = 'Failed to submit your request. Please try again.';
      setServerError(message);
      toast.error(message);
    }
  };

  /* ----------------------------- Success state ----------------------------- */
  if (submitted) {
    const airportLabel =
      airportOptions.find((option) => option.value === submitted.airport)?.label ??
      submitted.airport;
    const directionLabel =
      submitted.direction === 'ARRIVAL' ? 'Arrival (airport pickup)' : 'Departure (airport drop-off)';
    const summary = [
      'Airport Transfer Request',
      '',
      `Name: ${submitted.customerName}`,
      `Airport: ${airportLabel}`,
      `Type: ${directionLabel}`,
      `Date: ${submitted.date} at ${submitted.time}`,
      `Flight Number: ${submitted.flightNumber || 'Not provided'}`,
      `Pickup / Drop-off: ${submitted.location}`,
      `Passengers: ${submitted.passengers}`,
      `Luggage: ${submitted.luggage}`,
      `Vehicle Preference: ${
        VEHICLE_PREFERENCE_OPTIONS.find((option) => option.value === submitted.vehiclePreference)
          ?.label ?? submitted.vehiclePreference
      }`,
      `WhatsApp: ${submitted.whatsapp}`,
    ].join('\n');

    return (
      <div role="status" aria-live="polite" className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle
            className="h-8 w-8 text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
        </div>
        <h3 className="mb-2 font-heading text-2xl font-semibold text-gray-900 dark:text-white">
          Airport Transfer Request Received
        </h3>
        <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
          Thank you, {submitted.customerName}. We have your {airportLabel} details for{' '}
          {submitted.date} and will contact you on WhatsApp to confirm the transfer.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <WhatsAppButton
            message={generateGeneralWhatsAppMessage(summary)}
            label="Continue on WhatsApp"
            ariaLabel="Continue your airport transfer request on WhatsApp"
          />
          <Button variant="outline" onClick={() => setSubmitted(null)}>
            Make Another Request
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------ Form (idle) ------------------------------ */
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-busy={isSubmitting}
      className="space-y-5"
    >
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot — hidden from real users, bots fill it and are rejected. */}
      {/* Visually hidden, but type="text": React never fires onChange for
          type="hidden" inputs, which would let the bot's value slip past
          react-hook-form to the server check. */}
      <input
        type="text"
        {...register('honeypot')}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <fieldset
        disabled={isSubmitting}
        className="m-0 space-y-5 border-0 p-0 min-w-0"
      >
        <Select
          {...register('airport')}
          label="Airport"
          options={airportOptions}
          placeholder="Select airport"
          required
          error={errors.airport?.message}
        />

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Arrival / Departure
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DIRECTION_OPTIONS.map((option) => (
              <label
                key={option.value}
                htmlFor={`direction-${option.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-all',
                  direction === option.value
                    ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-900/20'
                    : 'border-gray-300 bg-white hover:border-primary-400 dark:border-gray-600 dark:bg-gray-800'
                )}
              >
                <input
                  id={`direction-${option.value}`}
                  type="radio"
                  value={option.value}
                  {...register('direction')}
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {errors.direction && (
            <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.direction.message}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            {...register('date')}
            type="date"
            label="Date"
            min={getLocalToday()}
            required
            error={errors.date?.message}
          />
          <Input {...register('time')} type="time" label="Time" required error={errors.time?.message} />
          <Input
            {...register('flightNumber')}
            label="Flight Number"
            placeholder="e.g., PK301"
            autoComplete="off"
            error={errors.flightNumber?.message}
          />
        </div>

        <Input
          {...register('location')}
          label="Pickup / Drop-off"
          placeholder="Hotel, office, or street address"
          helperText="The address we pick you up from, or drop you off at."
          required
          error={errors.location?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            {...register('passengers')}
            type="number"
            inputMode="numeric"
            label="Passengers"
            min={1}
            max={50}
            step={1}
            required
            error={errors.passengers?.message}
          />
          <Input
            {...register('luggage')}
            type="number"
            inputMode="numeric"
            label="Luggage"
            min={0}
            max={20}
            step={1}
            required
            error={errors.luggage?.message}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            {...register('vehiclePreference')}
            label="Vehicle Preference"
            options={VEHICLE_PREFERENCE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            required
            error={errors.vehiclePreference?.message}
          />
          <Input
            {...register('customerName')}
            label="Customer Name"
            autoComplete="name"
            required
            error={errors.customerName?.message}
          />
        </div>

        <Input
          {...register('whatsapp')}
          type="tel"
          label="WhatsApp Number"
          placeholder="+92 3XX XXXXXXX"
          autoComplete="tel"
          helperText="We will use this number to confirm your transfer."
          required
          error={errors.whatsapp?.message}
        />
      </fieldset>

      <div className="pt-1">
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Book Airport Transfer'}
        </Button>
        <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
          Your details are only used to arrange this transfer.
        </p>
      </div>
    </form>
  );
}
