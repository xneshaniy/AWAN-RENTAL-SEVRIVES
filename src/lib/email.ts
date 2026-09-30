import nodemailer from 'nodemailer';
import { SITE_URL, SITE_NAME, CONTACT_PHONE, CONTACT_EMAIL } from '@/config/site';

/**
 * Email notification layer.
 *
 * SECURITY: this module reads SMTP_HOST / SMTP_PORT / SMTP_USER /
 * SMTP_PASSWORD / ADMIN_EMAIL - all server-side environment variables.
 * Never import this module from a client component and never prefix these
 * variables with NEXT_PUBLIC_.
 *
 * RELIABILITY: `sendEmail` never throws. When SMTP is not configured it logs
 * and returns false; when a send fails it logs and returns false. Callers
 * persist their data FIRST and treat email as best-effort, so an email
 * problem can never fail a booking or a contact submission.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Escape untrusted text before embedding it in an HTML email body. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** True when the required SMTP environment variables are all present. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!transporter && isEmailConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Short timeouts: a dead SMTP server must not stall a booking or a
      // contact submission that is already safely stored in the database.
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const mailer = getTransporter();

  if (!mailer) {
    console.log('📧 Email not configured (SMTP missing). Skipping email send.');
    console.log('Would send to:', options.to);
    console.log('Subject:', options.subject);
    return false;
  }

  try {
    await mailer.sendMail({
      from: `"${SITE_NAME}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('✅ Email sent to:', options.to);
    return true;
  } catch (error) {
    // Log server-side only - never rethrow, never echo SMTP credentials.
    console.error('❌ Email send failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Reusable email templates
 *
 * All templates render through `renderEmailLayout` so every message has
 * the same header/footer, and every piece of user-supplied text passes
 * through `escapeHtml` first (defends against HTML injection into the
 * admin's and the customer's inboxes).
 * ------------------------------------------------------------------ */

interface LayoutOptions {
  /** <title> tag and preview text. */
  title: string;
  /** Main heading shown in the coloured banner. */
  heading: string;
  /** Banner background colour. */
  accent?: string;
  /** HTML for the body - already escaped by the caller. */
  content: string;
}

function renderEmailLayout({ title, heading, accent = '#0ea5e9', content }: LayoutOptions): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f172a; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #fbbf24; margin: 0; font-size: 28px; font-weight: 700;">${escapeHtml(SITE_NAME)}</h1>
    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Your Journey, Our Responsibility</p>
  </div>

  <div style="background: ${accent}; padding: 18px 30px; text-align: center;">
    <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">${escapeHtml(heading)}</p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
    ${content}
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; text-align: center;">
    <p style="color: #64748b; font-size: 14px; margin: 0 0 6px;">Need help? Contact us:</p>
    <p style="color: #0f172a; font-size: 14px; margin: 2px 0;"><strong>Phone/WhatsApp:</strong> ${escapeHtml(CONTACT_PHONE)}</p>
    <p style="color: #0f172a; font-size: 14px; margin: 2px 0;"><strong>Email:</strong> ${escapeHtml(CONTACT_EMAIL)}</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>&copy; ${year} ${escapeHtml(SITE_NAME)}. All rights reserved.</p>
  </div>
</body>
</html>`;
}

/** Compact key/value row for the details tables. */
function row(label: string, value: unknown): string {
  return `
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 500; vertical-align: top;">${escapeHtml(label)}</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${escapeHtml(value)}</td>
        </tr>`;
}

interface BookingEmailData {
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  rentalType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  returnDate: string;
  passengers: number;
  totalAmount: number;
  specialRequests?: string;
}

/**
 * Customer email: "Your Awan Rental Service Booking Request".
 * Confirms receipt only - payment and timing details are deferred to the
 * follow-up contact so the template never promises unverified policies.
 */
export function generateBookingEmailHtml(booking: BookingEmailData): string {
  const details = `
    <p>Dear <strong>${escapeHtml(booking.customerName)}</strong>,</p>
    <p>Thank you for choosing ${escapeHtml(SITE_NAME)}. We have received your booking request and our team will review it shortly.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">Booking Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Booking Reference:', booking.bookingNumber)}
        ${row('Vehicle:', booking.vehicleName)}
        ${row('Rental Type:', booking.rentalType)}
        ${row('Pickup Location:', booking.pickupLocation)}
        ${row('Drop-off Location:', booking.dropoffLocation)}
        ${row('Pickup Date:', booking.pickupDate)}
        ${row('Return Date:', booking.returnDate)}
        ${row('Passengers:', booking.passengers)}
        ${row('Estimated Total:', `Rs. ${booking.totalAmount.toLocaleString()}`)}
      </table>
      ${
        booking.specialRequests
          ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-weight: 500; margin: 0 0 8px;">Special Requests:</p>
        <p style="color: #0f172a; margin: 0;">${escapeHtml(booking.specialRequests).replace(/\n/g, '<br>')}</p>
      </div>`
          : ''
      }
    </div>

    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e;"><strong>What happens next?</strong></p>
      <ul style="margin: 12px 0 0; color: #92400e; padding-left: 20px;">
        <li>Our team will review availability and contact you during business hours.</li>
        <li>You will receive an update on WhatsApp and/or email.</li>
        <li>Booking and payment details will be confirmed when we contact you.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${SITE_URL}/booking/success/${encodeURIComponent(booking.bookingNumber)}" style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Booking Status</a>
    </div>`;

  return renderEmailLayout({
    title: `Booking Request - ${booking.bookingNumber}`,
    heading: 'Booking Request Received',
    content: details,
  });
}

interface AdminBookingEmailData extends BookingEmailData {
  customerEmail: string;
  customerPhone: string;
  customerWhatsApp: string;
}

/** Admin notification: "New Booking Received". */
export function generateAdminBookingNotificationHtml(booking: AdminBookingEmailData): string {
  const details = `
    <table style="width: 100%; border-collapse: collapse;">
      ${row('Booking Reference:', booking.bookingNumber)}
      ${row('Customer:', booking.customerName)}
      ${row('Email:', booking.customerEmail)}
      ${row('Phone:', booking.customerPhone)}
      ${row('WhatsApp:', booking.customerWhatsApp)}
      ${row('Vehicle:', booking.vehicleName)}
      ${row('Rental Type:', booking.rentalType)}
      ${row('Pickup:', booking.pickupLocation)}
      ${row('Drop-off:', booking.dropoffLocation)}
      ${row('Pickup Date:', booking.pickupDate)}
      ${row('Return Date:', booking.returnDate)}
      ${row('Passengers:', booking.passengers)}
      ${row('Total Amount:', `Rs. ${booking.totalAmount.toLocaleString()}`)}
      ${booking.specialRequests ? row('Special Requests:', booking.specialRequests) : ''}
    </table>
    <hr style="border-color: #e2e8f0; margin: 16px 0;">
    <p style="text-align: center; margin: 0;">
      <a href="${SITE_URL}/admin/bookings" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View in Admin Panel</a>
    </p>`;

  return renderEmailLayout({
    title: `New Booking: ${booking.bookingNumber}`,
    heading: 'New Booking Received',
    accent: '#dc2626',
    content: details,
  });
}

interface ContactEmailData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/** Admin notification for a contact/airport-transfer/inquiry message. */
export function generateContactEmailHtml(contact: ContactEmailData): string {
  const details = `
    <table style="width: 100%; border-collapse: collapse;">
      ${row('Name:', contact.name)}
      ${row('Email:', contact.email)}
      ${row('Phone:', contact.phone)}
      ${row('Subject:', contact.subject)}
    </table>
    <hr style="border-color: #e2e8f0; margin: 16px 0;">
    <p style="color: #64748b; font-weight: 500; margin: 0 0 8px;">Message:</p>
    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; color: #0f172a;">
      ${escapeHtml(contact.message).replace(/\n/g, '<br>')}
    </div>`;

  return renderEmailLayout({
    title: `New Message: ${contact.subject}`,
    heading: 'New Contact Message',
    accent: '#0ea5e9',
    content: details,
  });
}

/**
 * Customer acknowledgement ("Thank you for contacting us").
 * Shared by the contact form, API route and inquiry flows so the copy and
 * the response promise stay identical everywhere.
 */
export function generateContactAcknowledgementHtml(contact: {
  name: string;
  message: string;
}): string {
  const details = `
    <p>Dear <strong>${escapeHtml(contact.name)}</strong>,</p>
    <p>We have received your message and our team will get back to you during business hours.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: #64748b; font-weight: 500;">Your Message:</p>
      <p style="margin: 0; color: #0f172a;">${escapeHtml(contact.message).replace(/\n/g, '<br>')}</p>
    </div>
    <p>For inquiries, please contact us directly using the details below.</p>`;

  return renderEmailLayout({
    title: 'Thank You for Contacting Us',
    heading: 'Thank You for Contacting Us',
    content: details,
  });
}
