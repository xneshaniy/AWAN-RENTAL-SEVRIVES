'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { submitContactForm } from '@/actions/contact';
import { getWhatsAppUrl, generateServiceInquiryWhatsAppMessage } from '@/lib/whatsapp';
import { SERVICE_TYPES } from '@/config/corporate';

const corporateSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone is required'),
  whatsapp: z.string().optional(),
  serviceType: z.enum(['employee_transport', 'executive_travel', 'airport_transfer', 'event_transport', 'meeting_transport', 'long_term_contract']),
  passengers: z.coerce.number().min(1),
  vehicles: z.string().min(1, 'Vehicle requirement is required'),
  pickupLocation: z.string().min(2, 'Pickup location is required'),
  destination: z.string().min(2, 'Destination is required'),
  date: z.string().min(1, 'Date is required'),
  duration: z.string().optional(),
  requirements: z.string().optional(),
  honeypot: z.string().optional(),
}).refine(data => !data.honeypot, { message: 'Spam detected', path: ['honeypot'] });

export function CorporateInquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof corporateSchema>>({
    resolver: zodResolver(corporateSchema),
    defaultValues: {
      serviceType: 'employee_transport',
      honeypot: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof corporateSchema>) => {
    setIsSubmitting(true);
    try {
      // Compose a complete, human-readable inquiry message for the admin.
      const serviceLabel =
        SERVICE_TYPES.find(s => s.value === data.serviceType)?.label ?? data.serviceType;
      const message = [
        'Corporate transportation inquiry',
        '',
        `Company: ${data.companyName}`,
        `Contact Person: ${data.contactPerson}`,
        `Service: ${serviceLabel}`,
        `Passengers: ${data.passengers}`,
        `Preferred Date: ${data.date}`,
        `Vehicles Needed: ${data.vehicles}`,
        `Pickup: ${data.pickupLocation}`,
        `Destination: ${data.destination}`,
        data.duration ? `Duration: ${data.duration}` : null,
        data.requirements ? `Requirements: ${data.requirements}` : null,
        data.whatsapp ? `WhatsApp: ${data.whatsapp}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      // Belt-and-suspenders: read the honeypot straight from the DOM too, in
      // case a bot set .value without dispatching events (react-hook-form
      // only tracks event-driven changes).
      const domHoneypot =
        document.querySelector<HTMLInputElement>('form [name="honeypot"]')?.value || '';

      // Store the inquiry for real (same backend as the contact form) instead
      // of pretending a vehicle booking was created.
      const result = await submitContactForm({
        name: `${data.companyName} - ${data.contactPerson}`.slice(0, 100),
        email: data.email,
        phone: data.phone,
        subject: 'Corporate Travel Inquiry',
        message,
        honeypot: data.honeypot || domHoneypot,
      });

      if (result.success) {
        const whatsappMessage = generateServiceInquiryWhatsAppMessage(
          'Corporate Transportation',
          { customerName: `${data.companyName} - ${data.contactPerson}` }
        );
        toast.success('Corporate inquiry submitted! Our team will contact you shortly.');
        const whatsappUrl = getWhatsAppUrl(whatsappMessage);
        if (whatsappUrl) {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        } else {
          // Clear configuration state instead of opening a fake link.
          toast(
            'WhatsApp is not configured on this site yet — we will contact you by phone or email.'
          );
        }
      } else {
        toast.error(result.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Input
          {...register('companyName')}
          label="Company Name"
          error={errors.companyName?.message}
        />
        <Input
          {...register('contactPerson')}
          label="Contact Person"
          error={errors.contactPerson?.message}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          {...register('email')}
          type="email"
          label="Email"
          error={errors.email?.message}
        />
        <Input
          {...register('phone')}
          type="tel"
          label="Phone"
          placeholder="+92 3XX XXXXXXX"
          error={errors.phone?.message}
        />
      </div>
      <Input
        {...register('whatsapp')}
        type="tel"
        label="WhatsApp (Optional)"
        placeholder="+92 3XX XXXXXXX"
      />
      <Select
        {...register('serviceType')}
        label="Service Type"
        options={SERVICE_TYPES.map(s => ({ value: s.value, label: s.label }))}
        placeholder="Select service"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          {...register('passengers')}
          type="number"
          label="Number of Passengers"
          min={1}
          error={errors.passengers?.message}
        />
        <Input
          {...register('date')}
          type="date"
          label="Date"
          min={new Date().toISOString().split('T')[0]}
          error={errors.date?.message}
        />
      </div>
      <Input
        {...register('vehicles')}
        label="Vehicle Requirements"
        placeholder="e.g., 2 Sedans, 1 SUV, 1 Hiace"
        error={errors.vehicles?.message}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          {...register('pickupLocation')}
          label="Pickup Location"
          error={errors.pickupLocation?.message}
        />
        <Input
          {...register('destination')}
          label="Destination"
          error={errors.destination?.message}
        />
      </div>
      <Input
        {...register('duration')}
        label="Duration (Optional)"
        placeholder="e.g., Full day, 3 days, Monthly contract"
      />
      <Textarea
        {...register('requirements')}
        label="Additional Requirements"
        placeholder="Special needs, billing details, contract preferences, etc."
        rows={3}
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
        {isSubmitting ? 'Submitting...' : 'Submit Corporate Inquiry'}
      </Button>
    </form>
  );
}
