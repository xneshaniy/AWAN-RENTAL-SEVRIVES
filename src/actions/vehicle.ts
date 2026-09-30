'use server';

import { requireStaffAccess, requireAdminAccess } from '@/lib/admin-auth';

import { prisma } from '@/lib/prisma';
import { vehicleSchema, VehicleInput } from '@/lib/validations';
import { slugify, pickSortBy, pickSortOrder } from '@/lib/utils';
import { toVehicleDTO, toVehicleDetailDTO } from '@/lib/vehicles';
import { checkVehicleAvailability as runVehicleAvailabilityCheck } from '@/lib/vehicle-availability';
import { VehicleCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Public pages (homepage carousel, /vehicles, detail pages, sitemap) must
 * reflect admin changes immediately after any vehicle mutation.
 */
function revalidateVehiclePages() {
  revalidatePath('/', 'layout');
}

interface VehicleActionResult {
  success: boolean;
  vehicleId?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createVehicle(data: VehicleInput): Promise<VehicleActionResult> {
  await requireStaffAccess();
  const validated = vehicleSchema.safeParse(data);

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
    const baseSlug = slugify(`${validated.data.brand}-${validated.data.model}-${validated.data.year}`);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.vehicle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...validated.data,
        slug,
        dailyRate: validated.data.dailyRate,
        weeklyRate: validated.data.weeklyRate,
        monthlyRate: validated.data.monthlyRate,
      },
    });

    revalidateVehiclePages();
    return { success: true, vehicleId: vehicle.id };
  } catch (error) {
    console.error('Vehicle creation error:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'A vehicle with this license plate already exists' };
    }
    return { success: false, error: 'Failed to create vehicle' };
  }
}

export async function updateVehicle(id: string, data: Partial<VehicleInput>): Promise<VehicleActionResult> {
  await requireStaffAccess();
  const validated = vehicleSchema.partial().safeParse(data);

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
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Vehicle not found' };
    }

    const brand = validated.data.brand ?? existing.brand;
    const model = validated.data.model ?? existing.model;
    const year = validated.data.year ?? existing.year;

    // Only regenerate the slug when brand/model/year actually changed, so
    // unrelated edits never break the vehicle's public URL.
    let slug: string | undefined;
    if (brand !== existing.brand || model !== existing.model || year !== existing.year) {
      const baseSlug = slugify(`${brand}-${model}-${year}`);
      slug = baseSlug;
      let counter = 1;
      while (await prisma.vehicle.findFirst({ where: { slug, NOT: { id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const updateData: Record<string, unknown> = { ...validated.data };
    if (slug) updateData.slug = slug;
    if (updateData.dailyRate !== undefined) updateData.dailyRate = updateData.dailyRate;
    if (updateData.weeklyRate !== undefined) updateData.weeklyRate = updateData.weeklyRate;
    if (updateData.monthlyRate !== undefined) updateData.monthlyRate = updateData.monthlyRate;

    await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    revalidateVehiclePages();
    return { success: true };
  } catch (error) {
    console.error('Vehicle update error:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'A vehicle with this license plate already exists' };
    }
    return { success: false, error: 'Failed to update vehicle' };
  }
}

export async function deleteVehicle(id: string): Promise<VehicleActionResult> {
  await requireStaffAccess();
  try {
    const hasBookings = await prisma.booking.count({
      where: { vehicleId: id, status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } },
    });

    if (hasBookings > 0) {
      return { success: false, error: 'Cannot delete vehicle with active bookings. Archive it instead.' };
    }

    await prisma.vehicle.delete({ where: { id } });
    revalidateVehiclePages();
    return { success: true };
  } catch (error) {
    console.error('Vehicle deletion error:', error);
    return { success: false, error: 'Failed to delete vehicle' };
  }
}

/**
 * Soft-delete: the vehicle stays in PostgreSQL but disappears from every
 * public query. Availability is switched off as well so any cached booking
 * check treats it as unavailable.
 */
export async function archiveVehicle(id: string): Promise<VehicleActionResult> {
  await requireStaffAccess();
  try {
    await prisma.vehicle.update({
      where: { id },
      data: { archivedAt: new Date(), isAvailable: false },
    });
    revalidateVehiclePages();
    return { success: true };
  } catch (error) {
    console.error('Archive vehicle error:', error);
    return { success: false, error: 'Failed to archive vehicle' };
  }
}

/** Undo an archive. Booking availability stays off until re-enabled. */
export async function restoreVehicle(id: string): Promise<VehicleActionResult> {
  await requireStaffAccess();
  try {
    await prisma.vehicle.update({
      where: { id },
      data: { archivedAt: null },
    });
    revalidateVehiclePages();
    return { success: true };
  } catch (error) {
    console.error('Restore vehicle error:', error);
    return { success: false, error: 'Failed to restore vehicle' };
  }
}

export async function toggleVehicleAvailability(id: string, isAvailable: boolean): Promise<VehicleActionResult> {
  await requireStaffAccess();
  try {
    await prisma.vehicle.update({
      where: { id },
      data: { isAvailable },
    });
    revalidateVehiclePages();
    return { success: true };
  } catch (error) {
    console.error('Toggle availability error:', error);
    return { success: false, error: 'Failed to update availability' };
  }
}

export async function toggleVehicleFeatured(id: string, isFeatured: boolean): Promise<VehicleActionResult> {
  await requireStaffAccess();
  try {
    await prisma.vehicle.update({
      where: { id },
      data: { isFeatured },
    });
    revalidateVehiclePages();
    return { success: true };
  } catch (error) {
    console.error('Toggle featured error:', error);
    return { success: false, error: 'Failed to update featured status' };
  }
}

export async function getVehicles(filters: {
  category?: VehicleCategory;
  isAvailable?: boolean;
  isFeatured?: boolean;
  location?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  transmission?: 'MANUAL' | 'AUTOMATIC';
  /** true = only archived vehicles (admin view); omitted/false = only live ones. */
  archived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const { category, isAvailable, isFeatured, location, search, minPrice, maxPrice, seats, transmission, archived, page = 1, limit = 12, sortBy, sortOrder } = filters;
  // Server actions are directly invocable: re-whitelist sort input here even
  // though the public page already maps it to known fields.
  const safeSortBy = pickSortBy(sortBy, ['createdAt', 'updatedAt', 'name', 'dailyRate', 'year'] as const, 'createdAt');
  const safeSortOrder = pickSortOrder(sortOrder);
  // Bound pagination server-side: a directly-invoked action must not be
  // able to request an unbounded page.
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 12));

  const where: Record<string, unknown> = {};

  if (archived) where.archivedAt = { not: null };
  else where.archivedAt = null;

  if (category) where.category = category;
  if (isAvailable !== undefined) where.isAvailable = isAvailable;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (location) where.location = location;
  if (transmission) where.transmission = transmission;
  if (seats) where.seats = { gte: seats };
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: { gte?: number; lte?: number } = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    where.dailyRate = priceFilter;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    data: vehicles.map(toVehicleDTO),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  };
}

export async function getVehicleBySlug(slug: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { slug, archivedAt: null },
    include: {
      availability: { orderBy: { startDate: 'asc' } },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
        select: { startDate: true, endDate: true },
        orderBy: { startDate: 'asc' },
      },
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  return vehicle ? toVehicleDetailDTO(vehicle) : null;
}

export async function getVehicleById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      availability: { orderBy: { startDate: 'asc' } },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
        select: { startDate: true, endDate: true },
        orderBy: { startDate: 'asc' },
      },
    },
  });

  return vehicle ? toVehicleDetailDTO(vehicle) : null;
}

export async function getFeaturedVehicles(limit = 6) {
  const vehicles = await prisma.vehicle.findMany({
    where: { isFeatured: true, isAvailable: true, archivedAt: null },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return vehicles.map(toVehicleDTO);
}

export async function getVehiclesByCategory(category: VehicleCategory, limit = 8) {
  const vehicles = await prisma.vehicle.findMany({
    where: { category, isAvailable: true, archivedAt: null },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return vehicles.map(toVehicleDTO);
}

/** Filter options + counts for the public vehicle listing. */
export async function getVehicleFacets() {
  const [categories, availableCount, unavailableCount, featuredCount, totalCount] =
    await Promise.all([
      prisma.vehicle.groupBy({ by: ['category'], where: { archivedAt: null }, _count: { _all: true } }),
      prisma.vehicle.count({ where: { isAvailable: true, archivedAt: null } }),
      prisma.vehicle.count({ where: { isAvailable: false, archivedAt: null } }),
      prisma.vehicle.count({ where: { isFeatured: true, archivedAt: null } }),
      prisma.vehicle.count({ where: { archivedAt: null } }),
    ]);

  return {
    categories: categories.map((entry) => ({
      category: entry.category,
      count: entry._count._all,
    })),
    availableCount,
    unavailableCount,
    featuredCount,
    totalCount,
  };
}

/** Vehicles similar to the current one: same category first, then any other. */
export async function getSimilarVehicles(slug: string, category: VehicleCategory, limit = 4) {
  const [sameCategory, others] = await Promise.all([
    prisma.vehicle.findMany({
      where: { slug: { not: slug }, category, isAvailable: true, archivedAt: null },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    }),
    prisma.vehicle.findMany({
      where: { slug: { not: slug }, category: { not: category }, isAvailable: true, archivedAt: null },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    }),
  ]);

  return [...sameCategory, ...others].slice(0, limit).map(toVehicleDTO);
}

/**
 * Boolean availability answer used by the admin/vehicle UI. Delegates to the
 * shared server-side rules so it can never disagree with the checks enforced
 * during booking creation (conflicting bookings, maintenance blocks, vehicle
 * status). No rental type is passed, so capability checks are skipped here.
 */
export async function checkVehicleAvailability(vehicleId: string, startDate: Date, endDate: Date): Promise<boolean> {
  const decision = await runVehicleAvailabilityCheck({
    vehicleId,
    requested: { startDate, endDate },
  });
  return decision.available;
}

export async function getCategories() {
  return prisma.vehicle.groupBy({
    by: ['category'],
    where: { isAvailable: true },
    _count: { category: true },
  });
}

export async function getLocations() {
  return prisma.vehicle.groupBy({
    by: ['location'],
    where: { isAvailable: true },
    _count: { location: true },
  });
}