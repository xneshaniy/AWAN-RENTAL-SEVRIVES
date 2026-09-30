'use server';

import { requireStaffAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { ContactMessageStatus } from '@prisma/client';

interface MessageActionResult {
  success: boolean;
  error?: string;
}

function revalidateMessages() {
  revalidatePath('/admin/messages');
  revalidatePath('/admin', 'layout');
}

/** List contact messages with search + status/unread filters. Admin/staff only. */
export async function getContactMessages(
  filters: {
    search?: string;
    status?: ContactMessageStatus;
    unread?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  await requireStaffAccess();
  const { search, status, unread, page = 1, limit = 25 } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (unread) where.isRead = false;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [messages, total, unreadCount, openCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { isRead: false, status: { not: 'ARCHIVED' } } }),
    prisma.contactMessage.count({ where: { status: 'OPEN' } }),
  ]);

  return {
    data: messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    unreadCount,
    openCount,
  };
}

/** Toggle read/unread on one message. */
export async function setContactMessageRead(id: string, isRead: boolean): Promise<MessageActionResult> {
  await requireStaffAccess();
  try {
    await prisma.contactMessage.update({ where: { id }, data: { isRead } });
    revalidateMessages();
    return { success: true };
  } catch (error) {
    console.error('Set message read error:', error);
    return { success: false, error: 'Failed to update message' };
  }
}

/** Move a message between OPEN / RESOLVED / ARCHIVED. */
export async function setContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<MessageActionResult> {
  await requireStaffAccess();
  if (!['OPEN', 'RESOLVED', 'ARCHIVED'].includes(status)) {
    return { success: false, error: 'Invalid message status' };
  }
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { status, isRead: true },
    });
    revalidateMessages();
    return { success: true };
  } catch (error) {
    console.error('Set message status error:', error);
    return { success: false, error: 'Failed to update message' };
  }
}

/** Permanently delete a message. Requires confirmation in the UI. */
export async function deleteContactMessage(id: string): Promise<MessageActionResult> {
  await requireStaffAccess();
  try {
    await prisma.contactMessage.delete({ where: { id } });
    revalidateMessages();
    return { success: true };
  } catch (error) {
    console.error('Delete message error:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}
