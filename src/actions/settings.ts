'use server';

import { requireStaffAccess, requireAdminAccess } from '@/lib/admin-auth';

import { prisma } from '@/lib/prisma';
import { settingSchema, SettingInput, settingKeySchema, settingsUpdateSchema, serviceSchema, ServiceInput, faqSchema, FAQInput, testimonialSchema, TestimonialInput, locationSchema, LocationInput, promotionSchema, basePromotionSchema, PromotionInput } from '@/lib/validations';
import { getSetting, updateSetting as updateSettingUtil, getBusinessInfo, getWhatsAppConfig, getBookingConfig, getSEOConfig } from '@/lib/settings';
import { toServiceDTO, sortServices } from '@/lib/services';
import type { ServiceDTO } from '@/types';
import { revalidatePath } from 'next/cache';

interface SettingsActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function getAllSettings() {
  await requireStaffAccess();
  const settings = await prisma.setting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  });
  return settings;
}

export async function updateSetting(key: string, value: string): Promise<SettingsActionResult> {
  await requireAdminAccess();
  const validatedKey = settingKeySchema.safeParse(key);
  if (!validatedKey.success) {
    return { success: false, error: 'Invalid setting key' };
  }
  const validated = settingsUpdateSchema.safeParse({ [key]: value });
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Invalid value' };
  }

  try {
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
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Update setting error:', error);
    return { success: false, error: 'Failed to update setting' };
  }
}

export async function updateSettings(settings: Record<string, string>): Promise<SettingsActionResult> {
  await requireAdminAccess();
  // Server-side Zod validation - the client's own validation is never trusted.
  const validated = settingsUpdateSchema.safeParse(settings);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || 'Invalid settings',
      fieldErrors: validated.error.issues.reduce<Record<string, string[]>>((acc, issue) => {
        const key = String(issue.path[0] ?? '_');
        (acc[key] ||= []).push(issue.message);
        return acc;
      }, {}),
    };
  }
  try {
    await prisma.$transaction(
      Object.entries(validated.data).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, type: 'STRING', group: 'general', label: key },
        })
      )
    );
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Update settings error:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function createService(data: ServiceInput): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    const exists = await prisma.siteContent.findUnique({ where: { key: `service_${validated.data.slug}` } });
    if (exists) {
      return { success: false, error: 'A service with this slug already exists' };
    }

    await prisma.siteContent.create({
      data: {
        key: `service_${validated.data.slug}`,
        title: validated.data.name,
        content: JSON.stringify({
          description: validated.data.description,
          image: validated.data.image ?? null,
          active: validated.data.active,
          icon: validated.data.icon,
          href: validated.data.href,
          order: validated.data.order,
          features: validated.data.features,
        }),
      },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/services');
    revalidatePath('/services');
    return { success: true };
  } catch (error) {
    console.error('Create service error:', error);
    return { success: false, error: 'Failed to create service' };
  }
}

export async function updateService(slug: string, data: Partial<ServiceInput>): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = serviceSchema.partial().safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    const existing = await prisma.siteContent.findUnique({ where: { key: `service_${slug}` } });
    if (!existing) {
      return { success: false, error: 'Service not found' };
    }

    let currentContent: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(existing.content);
      if (parsed && typeof parsed === 'object') {
        currentContent = parsed as Record<string, unknown>;
      }
    } catch {
      currentContent = {};
    }

    // `name` and `slug` live on the row itself, not inside the content JSON.
    const contentFields: Record<string, unknown> = { ...validated.data };
    delete contentFields.name;
    delete contentFields.slug;

    const targetSlug = validated.data.slug && validated.data.slug !== slug ? validated.data.slug : null;
    if (targetSlug) {
      const conflict = await prisma.siteContent.findUnique({
        where: { key: `service_${targetSlug}` },
      });
      if (conflict) {
        return {
          success: false,
          error: 'A service with this slug already exists',
          fieldErrors: { slug: ['A service with this slug already exists'] },
        };
      }
    }

    await prisma.siteContent.update({
      where: { key: `service_${slug}` },
      data: {
        // Renaming the key implements "change slug": it changes the record's
        // identity (and the public lookup key) in one atomic update.
        ...(targetSlug ? { key: `service_${targetSlug}` } : {}),
        title: validated.data.name || existing.title,
        content: JSON.stringify({ ...currentContent, ...contentFields }),
      },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/services');
    revalidatePath('/services');
    return { success: true };
  } catch (error) {
    console.error('Update service error:', error);
    return { success: false, error: 'Failed to update service' };
  }
}

export async function deleteService(slug: string): Promise<SettingsActionResult> {
  await requireStaffAccess();
  try {
    await prisma.siteContent.delete({ where: { key: `service_${slug}` } });
    revalidatePath('/', 'layout');
    revalidatePath('/admin/services');
    revalidatePath('/services');
    return { success: true };
  } catch (error) {
    console.error('Delete service error:', error);
    return { success: false, error: 'Failed to delete service' };
  }
}

export async function getServices() {
  const services = await prisma.siteContent.findMany({
    where: { key: { startsWith: 'service_' } },
    orderBy: { title: 'asc' },
  });
  return services.map(s => {
    let content: unknown = {};
    try {
      content = JSON.parse(s.content);
    } catch {
      content = {};
    }
    return { ...s, content, slug: s.key.replace('service_', '') };
  });
}

/** Active services (what the public /services page renders), in display order. */
export async function getActiveServices(): Promise<ServiceDTO[]> {
  const services = await getServices();
  return sortServices(services.map(s => toServiceDTO(s)).filter(s => s.active));
}

/** One service by slug (used by service detail pages), or null when missing. */
export async function getServiceBySlug(slug: string): Promise<ServiceDTO | null> {
  const row = await prisma.siteContent.findUnique({ where: { key: `service_${slug}` } });
  if (!row) return null;

  let content: unknown = {};
  try {
    content = JSON.parse(row.content);
  } catch {
    content = {};
  }
  return toServiceDTO({ slug, title: row.title, content });
}

export async function createFAQ(data: FAQInput): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = faqSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await prisma.fAQ.create({ data: validated.data });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Create FAQ error:', error);
    return { success: false, error: 'Failed to create FAQ' };
  }
}

export async function updateFAQ(id: string, data: Partial<FAQInput>): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = faqSchema.partial().safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await prisma.fAQ.update({ where: { id }, data: validated.data });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Update FAQ error:', error);
    return { success: false, error: 'Failed to update FAQ' };
  }
}

export async function deleteFAQ(id: string): Promise<SettingsActionResult> {
  await requireStaffAccess();
  try {
    await prisma.fAQ.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return { success: false, error: 'Failed to delete FAQ' };
  }
}

export async function getFAQs() {
  return prisma.fAQ.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] });
}

export async function getAllFAQs() {
  await requireStaffAccess();
  return prisma.fAQ.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }] });
}

export async function createTestimonial(data: TestimonialInput): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = testimonialSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await prisma.testimonial.create({ data: validated.data });
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Create testimonial error:', error);
    return { success: false, error: 'Failed to create testimonial' };
  }
}

export async function updateTestimonial(id: string, data: Partial<TestimonialInput>): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = testimonialSchema.partial().safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await prisma.testimonial.update({ where: { id }, data: validated.data });
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Update testimonial error:', error);
    return { success: false, error: 'Failed to update testimonial' };
  }
}

export async function deleteTestimonial(id: string): Promise<SettingsActionResult> {
  await requireStaffAccess();
  try {
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return { success: false, error: 'Failed to delete testimonial' };
  }
}

export async function getTestimonials() {
  return prisma.testimonial.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
}

export async function getAllTestimonials() {
  await requireStaffAccess();
  return prisma.testimonial.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
}

export async function createLocation(data: LocationInput): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = locationSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    const exists = await prisma.location.findUnique({ where: { slug: validated.data.slug } });
    if (exists) {
      return { success: false, error: 'A location with this slug already exists' };
    }
    await prisma.location.create({ data: validated.data });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Create location error:', error);
    return { success: false, error: 'Failed to create location' };
  }
}

export async function updateLocation(id: string, data: Partial<LocationInput>): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = locationSchema.partial().safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await prisma.location.update({ where: { id }, data: validated.data });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Update location error:', error);
    return { success: false, error: 'Failed to update location' };
  }
}

export async function deleteLocation(id: string): Promise<SettingsActionResult> {
  await requireStaffAccess();
  try {
    await prisma.location.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Delete location error:', error);
    return { success: false, error: 'Failed to delete location' };
  }
}

export async function getLocations() {
  return prisma.location.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
}

export async function getAllLocations() {
  await requireStaffAccess();
  return prisma.location.findMany({ orderBy: { order: 'asc' } });
}

export async function createPromotion(data: PromotionInput): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = promotionSchema.safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    const exists = await prisma.promotion.findUnique({ where: { code: validated.data.code } });
    if (exists) {
      return { success: false, error: 'A promotion with this code already exists' };
    }
    await prisma.promotion.create({ data: validated.data });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Create promotion error:', error);
    return { success: false, error: 'Failed to create promotion' };
  }
}

export async function updatePromotion(id: string, data: Partial<PromotionInput>): Promise<SettingsActionResult> {
  await requireStaffAccess();
  const validated = basePromotionSchema.partial().safeParse(data);
  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await prisma.promotion.update({ where: { id }, data: validated.data });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Update promotion error:', error);
    return { success: false, error: 'Failed to update promotion' };
  }
}

export async function deletePromotion(id: string): Promise<SettingsActionResult> {
  await requireStaffAccess();
  try {
    await prisma.promotion.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Delete promotion error:', error);
    return { success: false, error: 'Failed to delete promotion' };
  }
}

export async function getPromotions() {
  return prisma.promotion.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
}

export async function getAllPromotions() {
  await requireStaffAccess();
  return prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
}