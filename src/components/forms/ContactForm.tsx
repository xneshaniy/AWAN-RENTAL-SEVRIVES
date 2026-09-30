'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { submitContactForm } from '@/actions/contact';
import { toast } from 'react-hot-toast';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().optional(),
}).refine(data => !data.honeypot, { message: 'Spam detected', path: ['honeypot'] });

const SUBJECTS = [
  { value: 'booking', label: 'Booking Inquiry' },
  { value: 'corporate', label: 'Corporate Services' },
  { value: 'airport', label: 'Airport Transfers' },
  { value: 'complaint', label: 'Complaint / Feedback' },
  { value: 'partnership', label: 'Partnership / Business' },
  { value: 'other', label: 'Other' },
];

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { honeypot: '' },
  });

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Belt-and-suspenders: read the honeypot straight from the DOM too, in
      // case a bot set .value without dispatching events (react-hook-form
      // only tracks event-driven changes).
      const domHoneypot =
        document.querySelector<HTMLInputElement>('form [name="honeypot"]')?.value || '';

      const result = await submitContactForm({
        ...data,
        honeypot: data.honeypot || domHoneypot,
      });
      if (result.success) {
        // The action returns the exact approved success text.
        const text = result.message || 'Thank you — your message has been received.';
        setSuccessMessage(text);
        setSubmitted(true);
        toast.success(text);
      } else {
        // Map server-side field errors back onto the form inputs.
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (field === 'honeypot') return;
            const message = messages?.[0];
            if (message) {
              setError(field as keyof z.infer<typeof contactSchema>, { type: 'server', message });
            }
          });
        }
        setErrorMessage(result.error || 'Failed to send message. Please try again.');
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <p className="font-heading font-semibold text-xl text-gray-900 dark:text-white mb-6">
          {successMessage}
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-busy={isSubmitting}>
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {errorMessage}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          {...register('name')}
          label="Full Name"
          error={errors.name?.message}
        />
        <Input
          {...register('email')}
          type="email"
          label="Email"
          error={errors.email?.message}
        />
      </div>
      <Input
        {...register('phone')}
        type="tel"
        label="Phone Number"
        placeholder="+92 3XX XXXXXXX"
        error={errors.phone?.message}
      />
      <Select
        {...register('subject')}
        label="Subject"
        options={SUBJECTS}
        placeholder="Select subject"
        error={errors.subject?.message}
      />
      <Textarea
        {...register('message')}
        label="Message"
        placeholder="Tell us how we can help you..."
        rows={4}
        error={errors.message?.message}
      />
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
      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        <Send className="w-4 h-4 mr-2" aria-hidden="true" />
        {isSubmitting ? 'Submitting...' : 'Send Message'}
      </Button>
    </form>
  );
}
