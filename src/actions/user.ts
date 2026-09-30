'use server';

import { requireStaffAccess, requireAdminAccess } from '@/lib/admin-auth';

import { prisma } from '@/lib/prisma';
import { adminUserSchema, AdminUserInput, adminLoginSchema, AdminLoginInput } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { signIn } from 'next-auth/react';
import { Role } from '@prisma/client';

interface UserActionResult {
  success: boolean;
  userId?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createAdminUser(data: AdminUserInput): Promise<UserActionResult> {
  await requireAdminAccess();
  const validated = adminUserSchema.safeParse(data);

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
    const existing = await prisma.user.findUnique({ where: { email: validated.data.email } });
    if (existing) {
      return { success: false, error: 'A user with this email already exists' };
    }

    const passwordHash = validated.data.password ? await bcrypt.hash(validated.data.password, 12) : null;

    const user = await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: passwordHash,
        role: validated.data.role,
        phone: validated.data.phone,
        city: validated.data.city,
        emailVerified: new Date(),
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Create admin user error:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function updateAdminUser(id: string, data: Partial<AdminUserInput>): Promise<UserActionResult> {
  await requireAdminAccess();
  const validated = adminUserSchema.partial().safeParse(data);

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
    const updateData: Record<string, unknown> = { ...validated.data };
    if (validated.data.password) {
      updateData.password = await bcrypt.hash(validated.data.password, 12);
    } else {
      delete updateData.password;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error('Update admin user error:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

export async function deleteAdminUser(id: string): Promise<UserActionResult> {
  await requireAdminAccess();
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return { success: false, error: 'Cannot delete the last admin user' };
      }
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Delete admin user error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function getAdminUsers() {
  await requireAdminAccess();
  return prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'STAFF'] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      city: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCustomers(filters: { search?: string; page?: number; limit?: number } = {}) {
  await requireStaffAccess();
  const { search, page = 1, limit = 20 } = filters;

  const where: Record<string, unknown> = { role: 'CUSTOMER' };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        createdAt: true,
        _count: { select: { bookings: true, inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCustomerById(id: string) {
  await requireStaffAccess();
  // Explicit select: the password hash must never leave the server.
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      role: true,
      createdAt: true,
      bookings: {
        include: { vehicle: { select: { name: true, brand: true, model: true } } },
        orderBy: { createdAt: 'desc' },
      },
      inquiries: { orderBy: { createdAt: 'desc' } },
    },
  });
}