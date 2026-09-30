import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';
import { sendEmail, generateContactEmailHtml, generateContactAcknowledgementHtml } from '@/lib/email';
import { getSetting } from '@/lib/settings';
import { rateLimit, clientIpFromHeaders } from '@/lib/rate-limit';
import { SITE_NAME } from '@/config/site';

/** Exact success text shown by the contact form and returned by this route. */
const CONTACT_SUCCESS_MESSAGE = 'Thank you — your message has been received.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', fieldErrors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Honeypot was rejected by the schema refine above; rate limit by IP+email.
    const { honeypot, ...contactData } = validated.data;
    const ip = clientIpFromHeaders(request.headers);
    if (
      !rateLimit(`contact:${ip}:${contactData.email.toLowerCase()}`, {
        limit: 5,
        windowMs: 10 * 60 * 1000,
      })
    ) {
      return NextResponse.json(
        { error: 'Too many messages sent in a short time. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    // Persist to the shared ContactMessage inbox read by /admin/messages.
    await prisma.contactMessage.create({
      data: {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        subject: contactData.subject,
        message: contactData.message,
      },
    });

    // Best-effort notifications — persistence already succeeded, so an SMTP
    // failure must not turn this into an error response. Both sends run in
    // parallel with the library's short SMTP timeouts.
    try {
      const adminEmail = (await getSetting('admin_email')) || process.env.ADMIN_EMAIL;
      const notifications: Promise<boolean>[] = [];

      if (adminEmail) {
        notifications.push(
          sendEmail({
            to: adminEmail,
            subject: `New Contact: ${contactData.subject}`,
            html: generateContactEmailHtml({
              name: contactData.name,
              email: contactData.email,
              phone: contactData.phone,
              subject: contactData.subject,
              message: contactData.message,
            }),
          })
        );
      }

      notifications.push(
        sendEmail({
          to: contactData.email,
          subject: `Thank you for contacting ${SITE_NAME}`,
          html: generateContactAcknowledgementHtml({
            name: contactData.name,
            message: contactData.message,
          }),
        })
      );

      await Promise.allSettled(notifications);
    } catch (emailError) {
      console.error('Contact notification emails failed (non-blocking):', emailError);
    }

    return NextResponse.json({
      success: true,
      message: CONTACT_SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json({ error: 'Failed to submit your message. Please try again.' }, { status: 500 });
  }
}