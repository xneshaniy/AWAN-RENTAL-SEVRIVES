'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { updateSettings } from '@/actions/settings';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Save } from 'lucide-react';

export interface SettingItem {
  key: string;
  value: string;
  label: string;
  type?: string;
  description?: string | null;
}

type FieldInput = 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'number' | 'checkbox' | 'select';

interface FieldDef {
  key: string;
  input: FieldInput;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface SectionDef {
  id: string;
  title: string;
  description: string;
  fields: FieldDef[];
}

/**
 * All editable settings sections. Field order here is the form order; values
 * are read from and written back to the SiteSettings table (ADMIN only).
 */
export const SETTINGS_SECTIONS: SectionDef[] = [
  {
    id: 'business',
    title: 'Business',
    description:
      'Company details used across the public site: contact page, footer, WhatsApp buttons and structured data.',
    fields: [
      {
        key: 'company_name',
        input: 'text',
        required: true,
        placeholder: 'e.g. Awan Rental Service',
        hint: 'Legal / trading name of the business.',
      },
      {
        key: 'company_phone',
        input: 'tel',
        placeholder: 'e.g. +92 3XX XXXXXXX',
        hint: 'Include the country code. Used for all call links.',
      },
      {
        key: 'company_whatsapp',
        input: 'tel',
        placeholder: 'e.g. +923XXXXXXXXX',
        hint: 'WhatsApp business number, country code without + or spaces preferred.',
      },
      {
        key: 'company_email',
        input: 'email',
        placeholder: 'e.g. bookings@example.com',
        hint: 'Primary email shown on the contact page.',
      },
      {
        key: 'company_address',
        input: 'textarea',
        placeholder: 'e.g. Office address, city',
        hint: 'Leave empty while no office address is confirmed - the public site hides it then.',
      },
      {
        key: 'google_maps_url',
        input: 'url',
        placeholder: 'https://maps.app.goo.gl/...',
        hint: 'Google Maps share link for the office. Shown as "View on Google Maps" on the contact page.',
      },
      {
        key: 'business_hours',
        input: 'textarea',
        placeholder: 'e.g. Monday - Saturday: 9:00 AM - 6:00 PM',
        hint: 'Leave empty while business hours are not confirmed - the public site hides them then.',
      },
      {
        key: 'service_areas',
        input: 'text',
        placeholder: 'e.g. Islamabad, Rawalpindi, Lahore',
        hint: 'Comma-separated areas served. Only use this to claim cities the business actually serves.',
      },
    ],
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'Full URLs of the business social profiles. Empty profiles are simply not shown.',
    fields: [
      { key: 'facebook_url', input: 'url', placeholder: 'https://facebook.com/yourpage', hint: 'Leave empty if there is no Facebook page.' },
      { key: 'instagram_url', input: 'url', placeholder: 'https://instagram.com/yourprofile', hint: 'Leave empty if there is no Instagram profile.' },
      { key: 'linkedin_url', input: 'url', placeholder: 'https://linkedin.com/company/yourcompany', hint: 'Leave empty if there is no LinkedIn page.' },
    ],
  },
  {
    id: 'booking',
    title: 'Booking',
    description: 'Rules applied to new booking requests and availability holds.',
    fields: [
      {
        key: 'default_booking_status',
        input: 'select',
        options: [
          { value: 'PENDING', label: 'Pending (needs admin confirmation)' },
          { value: 'CONFIRMED', label: 'Confirmed (auto-confirmed)' },
        ],
        hint: 'Status assigned to every new booking request.',
      },
      {
        key: 'pending_booking_hold_enabled',
        input: 'checkbox',
        hint: 'Temporarily block a vehicle\'s dates while a booking is still pending confirmation.',
      },
      {
        key: 'booking_hold_hours',
        input: 'number',
        placeholder: 'e.g. 24',
        hint: 'How long (in hours) a pending booking holds the dates before availability is released.',
      },
      {
        key: 'min_rental_days',
        input: 'number',
        placeholder: 'e.g. 1',
        hint: 'Minimum number of rental days accepted by the booking form.',
      },
      {
        key: 'max_rental_days',
        input: 'number',
        placeholder: 'e.g. 90',
        hint: 'Maximum number of rental days accepted by the booking form.',
      },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    description: 'Messages used when WhatsApp links are built from settings.',
    fields: [
      {
        key: 'whatsapp_number',
        input: 'tel',
        placeholder: 'e.g. +923XXXXXXXXX',
        hint: 'WhatsApp number used where links are built from settings (public buttons use NEXT_PUBLIC_WHATSAPP_NUMBER).',
      },
      {
        key: 'whatsapp_greeting',
        input: 'textarea',
        placeholder: 'e.g. Hello, I would like to inquire about your services.',
        hint: 'Default first message when someone starts a WhatsApp chat from a settings-driven button.',
      },
      {
        key: 'whatsapp_booking_template',
        input: 'textarea',
        placeholder: 'e.g. Booking {bookingNumber} for {vehicleName} on {pickupDate}. Please confirm.',
        hint:
          'Optional custom booking confirmation message. Leave empty to use the default message. '
          + 'Variables: {bookingNumber}, {customerName}, {customerPhone}, {vehicleName}, {rentalType}, '
          + '{pickupLocation}, {dropoffLocation}, {pickupDate}, {returnDate}, {passengers}, {specialRequests}.',
      },
    ],
  },
  {
    id: 'seo',
    title: 'SEO',
    description:
      'Default metadata for search results and social shares. Individual pages can override these; sitemap.xml and robots.txt are generated automatically.',
    fields: [
      {
        key: 'seo_title',
        input: 'text',
        placeholder: 'e.g. Awan Rental Service - Car Rental in Pakistan',
        hint: 'Site-wide title shown in browser tabs and search results (about 50-60 characters).',
      },
      {
        key: 'seo_description',
        input: 'textarea',
        placeholder: 'e.g. Car rental services in Islamabad, Rawalpindi and Lahore...',
        hint: 'Site-wide meta description for search results (about 150-160 characters).',
      },
      {
        key: 'og_image',
        input: 'text',
        placeholder: 'e.g. /hero.jpg',
        hint: 'Image used when links are shared on social media. Use a path inside /public.',
      },
    ],
  },
];

interface SettingsFormProps {
  /** Current values (plain strings) keyed by setting key. */
  settings: SettingItem[];
  /** Which sections to render (defaults to every section). */
  sections?: string[];
}

/**
 * Sectioned Site Settings form. Writes through the ADMIN-only
 * `updateSettings` action; every input has a visible label, hint and a
 * placeholder so empty values are obviously placeholders, never fake data.
 */
export function SettingsForm({ settings, sections }: SettingsFormProps) {
  const router = useRouter();
  const visibleSections = SETTINGS_SECTIONS.filter((section) =>
    (sections ?? SETTINGS_SECTIONS.map((s) => s.id)).includes(section.id)
  );

  const current = new Map(settings.map((setting) => [setting.key, setting.value]));
  const initial: Record<string, string> = {};
  visibleSections.forEach((section) =>
    section.fields.forEach((field) => {
      initial[field.key] = current.get(field.key) ?? '';
    })
  );

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    for (const section of visibleSections) {
      for (const field of section.fields) {
        const value = (values[field.key] ?? '').trim();
        if (field.required && !value) {
          return `${field.key === 'company_name' ? 'Company Name' : field.key} is required.`;
        }
        if (field.input === 'number' && value !== '') {
          const num = Number(value);
          if (Number.isNaN(num) || num < 0) {
            return `${field.key} must be a non-negative number.`;
          }
        }
        if (field.input === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
          return 'Enter a valid email address.';
        }
        if (field.input === 'url' && value && !/^https?:\/\//i.test(value)) {
          return 'URLs must start with http:// or https://';
        }
      }
    }
    return null;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {};
      visibleSections.forEach((section) =>
        section.fields.forEach((field) => {
          payload[field.key] = (values[field.key] ?? '').trim();
        })
      );

      const result = await updateSettings(payload);
      if (!result.success) {
        toast.error(result.error || 'Failed to save settings');
        return;
      }
      toast.success('Settings saved');
      router.refresh();
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldDef) => {
    const value = values[field.key] ?? '';
    const label =
      settings.find((setting) => setting.key === field.key)?.label ??
      field.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (field.input === 'checkbox') {
      return (
        <div
          key={field.key}
          className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
        >
          <input
            type="checkbox"
            id={`setting-${field.key}`}
            checked={value === 'true'}
            onChange={(event) => setValue(field.key, event.target.checked ? 'true' : 'false')}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor={`setting-${field.key}`} className="cursor-pointer">
            <span className="block font-medium text-gray-800 dark:text-gray-200">{label}</span>
            {field.hint && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">{field.hint}</span>
            )}
          </label>
        </div>
      );
    }

    if (field.input === 'textarea') {
      return (
        <Textarea
          key={field.key}
          id={`setting-${field.key}`}
          label={label}
          rows={3}
          value={value}
          placeholder={field.placeholder}
          helperText={field.hint}
          onChange={(event) => setValue(field.key, event.target.value)}
          disabled={isSubmitting}
          required={field.required}
        />
      );
    }

    if (field.input === 'select') {
      return (
        <Select
          key={field.key}
          id={`setting-${field.key}`}
          label={label}
          options={field.options ?? []}
          value={value}
          placeholder="Select..."
          helperText={field.hint}
          onChange={(event) => setValue(field.key, event.target.value)}
          disabled={isSubmitting}
        />
      );
    }

    return (
      <Input
        key={field.key}
        id={`setting-${field.key}`}
        label={label}
        type={
          field.input === 'number'
            ? 'number'
            : field.input === 'email'
              ? 'email'
              : field.input === 'tel'
                ? 'tel'
                : field.input === 'url'
                  ? 'url'
                  : 'text'
        }
        min={field.input === 'number' ? 0 : undefined}
        value={value}
        placeholder={field.placeholder}
        helperText={field.hint}
        onChange={(event) => setValue(field.key, event.target.value)}
        disabled={isSubmitting}
        required={field.required}
      />
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="space-y-6">
        {visibleSections.map((section) => (
          <Card key={section.id} variant="default" padding="md">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) =>
                field.input === 'textarea' || field.input === 'checkbox' ? (
                  <div key={field.key} className="sm:col-span-2">
                    {renderField(field)}
                  </div>
                ) : (
                  renderField(field)
                )
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
