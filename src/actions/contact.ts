'use server';

import { requireStaffAccess, requireAdminAccess } from '@/lib/admin-auth';

import { prisma } from '@/lib/prisma';
import { contactSchema, inquirySchema, ContactInput, InquiryInput } from '@/lib/validations';
import { sendEmail, generateContactEmailHtml, generateContactAcknowledgementHtml } from '@/lib/email';
import { getSetting } from '@/lib/settings';
import { rateLimit, clientIpFromHeaders } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { SITE_NAME } from '@/config/site';

interface ContactActionResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/** The exact success text the contact form must show after a submission. */
const CONTACT_SUCCESS_MESSAGE = 'Thank you — your message has been received.';

export async function submitContactForm(data: ContactInput): Promise<ContactActionResult> {
  const validated = contactSchema.safeParse(data);

  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const { honeypot, ...contactData } = validated.data;

  // Rate limit per IP + email so the public form cannot be flooded. The
  // honeypot was already rejected by the schema refine above.
  let ip = 'unknown';
  try {
    ip = clientIpFromHeaders(headers());
  } catch {
    ip = 'unknown';
  }
  if (
    !rateLimit(`contact:${ip}:${contactData.email.toLowerCase()}`, { limit: 5, windowMs: 10 * 60 * 1000 })
  ) {
    return {
      success: false,
      error: 'Too many messages sent in a short time. Please wait a few minutes and try again.',
    };
  }

  try {
    // Persist first: this is the single source of truth the admin inbox
    // (/admin/messages) reads from.
    await prisma.contactMessage.create({
      data: {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        subject: contactData.subject,
        message: contactData.message,
      },
    });
  } catch (error) {
    console.error('Contact form persistence error:', error);
    return { success: false, error: 'Failed to submit your message. Please try again.' };
  }

  // Best-effort notifications — the message is already saved, so an SMTP
  // failure must never turn this into an error response.
  try {
    const adminEmail = (await getSetting('admin_email')) || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Contact: ${contactData.subject}`,
        html: generateContactEmailHtml({
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          subject: contactData.subject,
          message: contactData.message,
        }),
      });
    }

    await sendEmail({
      to: contactData.email,
      subject: `Thank you for contacting ${SITE_NAME}`,
      html: generateContactAcknowledgementHtml({
        name: contactData.name,
        message: contactData.message,
      }),
    });
  } catch (emailError) {
    console.error('Contact notification emails failed (non-blocking):', emailError);
  }

  return { success: true, message: CONTACT_SUCCESS_MESSAGE };
}

export async function submitInquiry(data: InquiryInput): Promise<ContactActionResult> {
  const validated = inquirySchema.safeParse(data);

  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validated.error.errors) {
      const path = error.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(error.message);
    }
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const { honeypot, ...inquiryData } = validated.data;

  // Same rate-limit guard as the contact form, namespaced per source.
  let ip = 'unknown';
  try {
    ip = clientIpFromHeaders(headers());
  } catch {
    ip = 'unknown';
  }
  if (!rateLimit(`inquiry:${ip}:${inquiryData.email.toLowerCase()}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return {
      success: false,
      error: 'Too many messages sent in a short time. Please wait a few minutes and try again.',
    };
  }

  try {
    // Stored in the shared ContactMessage inbox (/admin/messages).
    await prisma.contactMessage.create({
      data: {
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone,
        subject: inquiryData.subject,
        message: inquiryData.message,
      },
    });

    const adminEmail = (await getSetting('admin_email')) || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Inquiry: ${inquiryData.subject}`,
        html: generateContactEmailHtml({
          name: inquiryData.name,
          email: inquiryData.email,
          phone: inquiryData.phone,
          subject: inquiryData.subject,
          message: inquiryData.message,
        }),
      });
    }

    return { success: true, message: 'Your inquiry has been submitted. We will contact you soon.' };
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return { success: false, error: 'Failed to submit inquiry. Please try again.' };
  }
}

export async function getInquiries(filters: {
  status?: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  await requireStaffAccess();
  const { status, search, page = 1, limit = 20 } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return {
    data: inquiries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateInquiryStatus(id: string, status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED', response?: string, respondedBy?: string) {
  await requireStaffAccess();
  return prisma.inquiry.update({
    where: { id },
    data: {
      status,
      response,
      respondedAt: response ? new Date() : null,
      respondedBy,
    },
  });
}