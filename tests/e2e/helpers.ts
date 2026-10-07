import {
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Shared vocabulary for the browser E2E suite.
 *
 * Selectors here are the accessibility contracts the components already
 * publish (`aria-label`, `role`, `name`) rather than CSS classes, so a
 * restyle cannot silently turn a passing assertion into a false one.
 */

/** Must match `NEXTAUTH_URL` in `.env.e2e`, otherwise sign-in redirects break. */
export const BASE_URL = 'http://localhost:3000';

/**
 * Name prefix for the vehicle the gallery upload spec creates.
 *
 * Shared by the spec (which creates it) and global setup/teardown (which remove
 * a leftover one from a killed run). Prefix matching keeps every one of the
 * eight production vehicle records outside the delete.
 */
export const GALLERY_VEHICLE_PREFIX = 'E2E Gallery Probe';

export interface E2EData {
  adminEmail: string;
  adminPassword: string;
  staffEmail: string;
  staffPassword: string;
  customerEmail: string;
  customerPassword: string;
  vehicleId: string;
  vehicleName: string;
  startedAt: string;
}

let cached: E2EData | null = null;

/** Values written by global-setup; read lazily so module load never throws. */
export function readData(): E2EData {
  if (!cached) {
    cached = JSON.parse(
      readFileSync(resolve(process.cwd(), 'tests', 'e2e', '.data.json'), 'utf8')
    ) as E2EData;
  }
  return cached;
}

/** `YYYY-MM-DD` n days from now - always in the future, however slow the run. */
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

let sequence = 0;

/** Distinct per call, so two runs can never collide on a uniqueness index. */
export function uniqueEmail(prefix = 'e2e'): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}@example.com`;
}

/**
 * Each booking gets its OWN three-week-wide date window.
 *
 * A PENDING booking holds its vehicle for the configured temporary-hold
 * window, so two seeds on the same dates come back `409 - vehicle is on a
 * temporary hold`. Stepping forward from a per-process base means seeds never
 * overlap each other, and the random base means a worker that restarts part
 * way through a run does not immediately reuse a range the previous worker
 * already booked.
 *
 * The furthest window this can reach is about eight months out, comfortably
 * inside any sane booking horizon and always in the future.
 */
let bookingWindow = 0;
const BOOKING_BASE_DELAY_DAYS = 60 + Math.floor(Math.random() * 8) * 7;
const BOOKING_WINDOW_STEP_DAYS = 21;

interface BookingOverrides {
  customerName?: string;
  customerEmail?: string;
  [key: string]: unknown;
}

/**
 * A valid `POST /api/bookings` body.
 *
 * `customerName` always starts with `E2E ` because global-teardown deletes
 * test bookings by that prefix - changing it would orphan test data.
 */
export function bookingPayload(overrides: BookingOverrides = {}): Record<string, unknown> {
  const data = readData();
  const pickupOffset = BOOKING_BASE_DELAY_DAYS + bookingWindow * BOOKING_WINDOW_STEP_DAYS;
  bookingWindow += 1;

  return {
    customerName: 'E2E Test Customer',
    customerEmail: uniqueEmail('e2e-booking'),
    customerPhone: '+923001234567',
    customerWhatsApp: '',
    vehicleId: data.vehicleId,
    rentalType: 'SELF_DRIVE',
    pickupLocation: 'Islamabad Airport',
    dropoffLocation: 'Lahore City',
    pickupDate: daysFromNow(pickupOffset),
    pickupTime: '10:00',
    returnDate: daysFromNow(pickupOffset + 3),
    returnTime: '10:00',
    flightNumber: '',
    passengers: 2,
    luggage: 2,
    specialRequests: '',
    submissionId: '',
    // Honeypot must stay empty: a filled value is rejected as spam.
    honeypot: '',
    ...overrides,
  };
}

export interface BookingResult {
  status: number;
  ok: boolean;
  bookingNumber?: string;
  whatsappUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Creates a booking over HTTP, exactly as the public form would.
 *
 * `409` means the vehicle is already held for those dates - which happens
 * when a previous seed (or a worker restart re-running `beforeAll`) took the
 * same window. Every retry calls `bookingPayload()` again, which advances to
 * the next free window, so a retry always makes progress instead of looping.
 */
export async function createBooking(
  api: APIRequestContext,
  overrides: BookingOverrides = {},
  attempts = 3
): Promise<BookingResult> {
  let last: BookingResult = { status: 0, ok: false };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const res = await api.post('/api/bookings', { data: bookingPayload(overrides) });
    const body = (await res.json()) as Record<string, unknown>;
    last = {
      status: res.status(),
      ok: res.ok(),
      bookingNumber: body.bookingNumber as string | undefined,
      whatsappUrl: body.whatsappUrl as string | undefined,
      error: body.error as string | undefined,
      fieldErrors: body.fieldErrors as Record<string, string[]> | undefined,
    };
    if (last.ok || last.status !== 409) return last;
  }
  return last;
}

/** A fresh anonymous API client (no cookies from any browser context). */
export async function anonymousApi(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: BASE_URL });
}

/** The bell trigger button; its label carries the live unread count. */
export function bellTrigger(page: Page): Locator {
  return page.locator('button[aria-label^="Notifications"]');
}

/** The dropdown panel rendered when the bell is open. */
export function bellPanel(page: Page): Locator {
  return page.locator('[role="dialog"][aria-label="Notifications"]');
}

/** Numeric unread badge inside the trigger (never the amber status dot). */
export function bellBadge(page: Page): Locator {
  return bellTrigger(page).locator('span').filter({ hasText: /^\d+$/ });
}

/**
 * A visible toast whose text contains `text`.
 *
 * react-hot-toast marks each toast `role="status"`, and the notification
 * panel is the only other place a notification title is rendered - so specs
 * close the dropdown before using this and assert an exact count of 1.
 */
export function toastWith(page: Page, text: string): Locator {
  return page.locator('[role="status"]').filter({ hasText: text });
}

/** Signs in through the real form; returns once the dashboard URL is reached. */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/admin/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/admin');
}

/**
 * Opens the bell if it is shut and returns the panel's current text.
 *
 * Used inside `expect.poll` so a poll never has to reason about which state
 * the dropdown happens to be in - the panel is opened explicitly and waited
 * for, which removes the React-render race a bare `isVisible()` would have.
 */
export async function readBellPanel(page: Page): Promise<string> {
  if (!(await bellPanel(page).isVisible())) {
    await bellTrigger(page).click();
    await expect(bellPanel(page)).toBeVisible({ timeout: 10_000 });
  }
  return bellPanel(page).innerText();
}

/**
 * Deletes every notification (and, by cascade, its per-user read rows) so a
 * spec file starts from a known zero.
 *
 * Spec files share one local database. Without a reset, a booking created by
 * an earlier file would still be listed by a later one, which would break
 * exact assertions such as "the dropdown contains exactly one timestamp".
 * Notifications are derived rows - a title, a sentence and a deep link - so
 * removing them loses no business data, and the ones a test needs are
 * regenerated the moment it creates its own booking.
 */
export async function resetNotifications(): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.notification.deleteMany({});
  } finally {
    await prisma.$disconnect();
  }
}

export interface OverflowReport {
  clientWidth: number;
  scrollWidth: number;
  /** Elements whose right edge passes the viewport, newest offenders last. */
  offenders: string[];
}

/**
 * Measures horizontal overflow and names the elements causing it.
 *
 * A bare "scrollWidth is 207 too wide" tells you nothing about which of the
 * hundred nodes on an admin page is responsible, so this walks the DOM and
 * reports the tag, class, position and width of every element that crosses
 * the right edge. Used by the responsive spec so a failure is diagnosable
 * from the test output alone.
 */
export async function horizontalOverflowReport(page: Page): Promise<OverflowReport> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const width = root.clientWidth;
    const offenders: string[] = [];
    document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (rect.right <= width + 1) return;
      const cls = (el.getAttribute('class') ?? '').replace(/\s+/g, ' ').trim();
      offenders.push(
        `${el.tagName.toLowerCase()}${cls ? `.${cls.split(' ').slice(0, 6).join('.')}` : ''} ` +
          `right=${Math.round(rect.right)} width=${Math.round(rect.width)} ` +
          `text="${(el.textContent ?? '').trim().slice(0, 40)}"`
      );
    });
    return {
      clientWidth: width,
      scrollWidth: root.scrollWidth,
      offenders: offenders.slice(0, 15),
    };
  });
}

/** Reads the number rendered inside a dashboard stat card by its label. */
export function statValue(page: Page, label: string): Locator {
  return page
    .locator('a')
    .filter({ has: page.getByText(label, { exact: true }) })
    .first()
    .locator('p.font-heading')
    .first();
}
