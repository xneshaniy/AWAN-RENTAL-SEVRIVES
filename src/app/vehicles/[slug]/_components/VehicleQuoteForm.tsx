'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import { contactSchema, ContactInput } from '@/lib/validations';
import { submitContactForm } from '@/actions/contact';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface VehicleQuoteFormProps {
  vehicleName: string;
  onSuccess?: () => void;
}

/**
 * "Request This Vehicle" / "Request a Quote" form.
 * Submits to the contact server action (Zod validated, honeypot protected),
 * which stores the inquiry and notifies the admin.
 */
export function VehicleQuoteForm({ vehicleName, onSuccess }: VehicleQuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: `Vehicle request: ${vehicleName}`,
      message: `Hello, I would like to request availability and a quote for the ${vehicleName}.`,
      honeypot: '',
    },
  });

  const onSubmit = async (data: ContactInput) => {
    setIsSubmitting(true);
    try {
      const result = await submitContactForm(data);

      if (result.success) {
        toast.success('Request sent! Our team will get back to you shortly.');
        reset();
        onSuccess?.();
        return;
      }

      toast.error(result.error || 'Failed to send your request. Please try again.');
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages.length > 0) {
            setError(field as keyof ContactInput, { message: messages[0] });
          }
        });
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
      <input type="hidden" {...register('subject')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          type="tel"
          label="Phone / WhatsApp"
          placeholder="Your phone number"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <Input
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Textarea
        label="Message"
        rows={4}
        placeholder="Tell us your rental dates, pickup location, and any requirements."
        error={errors.message?.message}
        {...register('message')}
      />

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-4 h-4 mr-2" aria-hidden="true" />
        )}
        {isSubmitting ? 'Submitting...' : 'Send Request'}
      </Button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Your details are only used to answer this request.
      </p>
    </form>
  );
}
