import * as React from 'react';
import { prisma } from '@/lib/prisma';
import { SettingType } from '@prisma/client';
import { SITE_NAME, WHATSAPP_NUMBER } from '@/config/site';

/**
 * React's request-scoped cache. `React.cache` exists in the React Server
 * Components runtime Next.js uses; when this module is imported by plain
 * Node (the test runner), it falls back to a pass-through so the import
 * stays safe and behaviour stays correct - just without memoization.
 */
const reactCache = (React as unknown as { cache?: <T>(fn: T) => T }).cache;
const cache: <T>(fn: T) => T = reactCache ?? ((fn) => fn);

/**
 * Settings readers are memoized with React `cache`, so the root layout,
 * the page and any components on the same request share one query instead
 * of re-reading the Setting table for every call. The cache is request
 * scoped: the next request after an admin save reads fresh values.
 */
export const getSetting = cache(async (key: string): Promise<string | null> => {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });
  return setting?.value ?? null;
});

/** Batch-read several settings in one query instead of one query per key. */
async function getSettingsMap(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export const getPublicSettings = cache(async (): Promise<Record<string, string>> => {
  const settings = await prisma.setting.findMany({
    where: { isPublic: true },
    select: { key: true, value: true },
  });
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
});

export async function getSettingsByGroup(group: string): Promise<Record<string, { value: string; type: SettingType; label: string; description?: string | null }>> {
  const settings = await prisma.setting.findMany({
    where: { group },
  });
  return settings.reduce((acc, setting) => {
    acc[setting.key] = {
      value: setting.value,
      type: setting.type,
      label: setting.label,
      description: setting.description,
    };
    return acc;
  }, {} as Record<string, { value: string; type: SettingType; label: string; description?: string | null }>);
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      type: 'STRING',
      group: 'general',
      label: key,
    },
  });
}

export const getBusinessInfo = cache(async () => {
  const map = await getSettingsMap([
    'company_name',
    'company_phone',
    'company_whatsapp',
    'company_email',
    'company_address',
    'google_maps_url',
    'business_hours',
    'service_areas',
    'facebook_url',
    'instagram_url',
    'linkedin_url',
  ]);

  return {
    companyName: map.company_name || SITE_NAME,
    companyPhone: map.company_phone || '',
    companyWhatsApp: map.company_whatsapp || '',
    companyEmail: map.company_email || '',
    companyAddress: map.company_address || '',
    googleMapsUrl: map.google_maps_url || '',
    businessHours: map.business_hours || '',
    /** Areas the business actually serves (comma-separated setting), [] when unset. */
    serviceAreas: (map.service_areas || '')
      .split(',')
      .map((area) => area.trim())
      .filter(Boolean),
    social: {
      facebook: map.facebook_url || '',
      instagram: map.instagram_url || '',
      linkedin: map.linkedin_url || '',
    },
  };
});

export const getWhatsAppConfig = cache(async () => {
  const map = await getSettingsMap(['whatsapp_number', 'whatsapp_greeting']);

  return {
    number: map.whatsapp_number || WHATSAPP_NUMBER,
    greeting:
      map.whatsapp_greeting || `Hello ${SITE_NAME}, I would like to inquire about your services.`,
  };
});

export const getBookingConfig = cache(async () => {
  const map = await getSettingsMap([
    'booking_hold_hours',
    'pending_booking_hold_enabled',
    'min_rental_days',
    'max_rental_days',
    'default_booking_status',
  ]);

  return {
    holdHours: parseInt(map.booking_hold_hours || '24', 10),
    /** Temporary hold applied to PENDING bookings (see `@/lib/availability`). */
    holdEnabled: (map.pending_booking_hold_enabled || 'true').toLowerCase() !== 'false',
    minDays: parseInt(map.min_rental_days || '1', 10),
    maxDays: parseInt(map.max_rental_days || '90', 10),
    defaultStatus: map.default_booking_status || 'PENDING',
  };
});

export const getSEOConfig = cache(async () => {
  const map = await getSettingsMap(['seo_title', 'seo_description', 'og_image']);

  return {
    title: map.seo_title || `${SITE_NAME} - Car Rental & Transportation in Pakistan`,
    description:
      map.seo_description ||
      'Professional car rental and ground transportation services in Islamabad, Rawalpindi, Lahore and nationwide Pakistan.',
    ogImage: map.og_image || '/og-image.jpg',
  };
});
