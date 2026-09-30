import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | { toString(): string } | null | undefined, currency = 'PKR'): string {
  if (amount === null || amount === undefined) return 'PKR 0';
  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  if (isNaN(num)) return 'PKR 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Booking reference in the ARS-XXXXXX format (6 alphanumeric characters).
 * Uniqueness is enforced by the `bookingNumber` unique constraint in the
 * database; callers retry with a fresh value on collision.
 */
export function generateBookingNumber(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ARS-${suffix}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Whitelist a user-supplied sort field before it reaches Prisma's orderBy.
 * Raw request input must never be used as a column name.
 */
export function pickSortBy(
  value: string | null | undefined,
  allowed: readonly string[],
  fallback: string
): string {
  return value && allowed.includes(value) ? value : fallback;
}

/** Coerce a user-supplied sort direction to a valid 'asc' | 'desc'. */
export function pickSortOrder(value: string | null | undefined): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc';
}

export function getWhatsAppLink(message: string, number?: string): string | null {
  // Only the configured number is ever used — no hardcoded fallback.
  const whatsappNumber = number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
  // wa.me requires digits only (no "+", spaces or dashes)
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  if (!cleanNumber) return null;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateBookingTotal(
  dailyRate: number,
  days: number,
  weeklyRate?: number,
  monthlyRate?: number,
  driverRate?: number,
  driverDays?: number
): { subtotal: number; driverCost: number; total: number } {
  let subtotal = 0;

  if (monthlyRate && days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    subtotal = months * monthlyRate;

    if (remainingDays >= 7 && weeklyRate) {
      const weeks = Math.floor(remainingDays / 7);
      const extraDays = remainingDays % 7;
      subtotal += weeks * weeklyRate + extraDays * dailyRate;
    } else {
      subtotal += remainingDays * dailyRate;
    }
  } else if (weeklyRate && days >= 7) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    subtotal = weeks * weeklyRate + remainingDays * dailyRate;
  } else {
    subtotal = days * dailyRate;
  }

  const driverCost = driverRate && driverDays ? driverRate * driverDays : 0;

  return {
    subtotal,
    driverCost,
    total: subtotal + driverCost,
  };
}

export function getVehicleCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ECONOMY: 'Economy',
    SEDAN: 'Sedan',
    SUV: 'SUV',
    LUXURY: 'Luxury',
    VAN: 'Van',
    MINIBUS: 'Minibus',
    COASTER: 'Coaster',
    HIGHLACE: 'Hiace',
    PICKUP: 'Pickup',
  };
  return labels[category] || category;
}

export function getVehicleCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    ECONOMY: 'car',
    SEDAN: 'car',
    SUV: 'truck',
    LUXURY: 'gem',
    VAN: 'bus',
    MINIBUS: 'bus',
    COASTER: 'bus',
    HIGHLACE: 'bus',
    PICKUP: 'truck',
  };
  return icons[category] || 'car';
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    NO_SHOW: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    ACTIVE: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };
  return labels[status] || status;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    UNPAID: 'bg-red-100 text-red-800 border-red-200',
    PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    REFUNDED: 'bg-blue-100 text-blue-800 border-blue-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getInquiryStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function isValidPhoneNumber(phone: string): boolean {
  const pakistanPhoneRegex = /^(\+92|0)?3\d{9}$/;
  return pakistanPhoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('92')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+92${cleaned.slice(1)}`;
  }
  return `+92${cleaned}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}