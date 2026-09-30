import { Vehicle, Booking, User, Inquiry, Setting, Location, Testimonial, FAQ, Promotion, SiteContent, VehicleCategory, BookingStatus, PaymentStatus } from '@prisma/client';

export type { Vehicle, Booking, User, Inquiry, Setting, Location, Testimonial, FAQ, Promotion, SiteContent, VehicleCategory, BookingStatus, PaymentStatus };

export interface VehicleWithRelations extends Vehicle {
  availability?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
    isBlocked: boolean;
  }>;
  bookings?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
  }>;
  _count?: {
    bookings: number;
    reviews: number;
  };
}

/**
 * Vehicle serialised for client components: Prisma Decimal rates are converted
 * to plain numbers so they survive the server -> client boundary intact.
 */
export type VehicleDTO = Omit<Vehicle, 'dailyRate' | 'weeklyRate' | 'monthlyRate'> & {
  dailyRate: number;
  weeklyRate: number | null;
  monthlyRate: number | null;
};

export interface VehicleAvailabilityWindow {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isBlocked: boolean;
}

export interface VehicleBookingWindow {
  startDate: string;
  endDate: string;
}

/** Vehicle detail payload (rates as numbers, dates as ISO strings). */
export type VehicleDetailDTO = VehicleDTO & {
  availability: VehicleAvailabilityWindow[];
  bookings: VehicleBookingWindow[];
};

export interface AvailabilityPeriod {
  start: string;
  end: string;
  label: string;
}

export interface VehicleFacets {
  categories: Array<{ category: VehicleCategory; count: number }>;
  availableCount: number;
  unavailableCount: number;
  featuredCount: number;
  totalCount: number;
}

export type VehicleAvailabilityFilter = 'all' | 'available' | 'unavailable';
export type VehicleSortOption = 'newest' | 'price-asc' | 'price-desc' | 'name';

export interface VehicleListingFilters {
  q: string;
  category: string;
  availability: VehicleAvailabilityFilter;
  featured: boolean;
  sort: VehicleSortOption;
  page: number;
}

/** A feature bullet shown on a service detail page (stored in SiteContent JSON). */
export interface ServiceFeature {
  title: string;
  description: string;
}

/**
 * Service record serialised from the database (SiteContent rows keyed
 * `service_<slug>`). All editable fields live in the row so the admin can
 * change them later without code changes.
 */
export interface ServiceDTO {
  slug: string;
  name: string;
  description: string;
  image: string | null;
  /** Icon key resolved by the icon registry in `@/lib/services`. */
  icon: string;
  /** Page this service links to, e.g. `/self-drive`. */
  href: string;
  active: boolean;
  order: number;
  features: ServiceFeature[];
}

export interface BookingWithRelations extends Booking {
  user?: User | null;
  vehicle?: Vehicle | null;
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: PaymentStatus;
    paidAt: Date;
  }>;
  documents?: Array<{
    id: string;
    type: string;
    url: string;
    name: string;
  }>;
}

export interface UserWithRelations extends User {
  bookings?: Booking[];
  _count?: {
    bookings: number;
    inquiries: number;
  };
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  newMessages: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface BookingFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  vehicleId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleFilters {
  category?: VehicleCategory;
  isAvailable?: boolean;
  isFeatured?: boolean;
  location?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  transmission?: 'MANUAL' | 'AUTOMATIC';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, unknown>;
}

export interface BusinessInfo {
  companyName: string;
  companyPhone: string;
  companyWhatsApp: string;
  companyEmail: string;
  companyAddress: string;
  businessHours: string;
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
}

export interface WhatsAppConfig {
  number: string;
  greeting: string;
}

export interface BookingConfig {
  holdHours: number;
  minDays: number;
  maxDays: number;
  defaultStatus: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  ogImage: string;
}

export interface VehicleCategoryInfo {
  value: VehicleCategory;
  label: string;
  icon: string;
  description: string;
}

export const VEHICLE_CATEGORIES: VehicleCategoryInfo[] = [
  { value: 'ECONOMY', label: 'Economy', icon: 'car', description: 'Budget-friendly cars for city driving' },
  { value: 'SEDAN', label: 'Sedan', icon: 'car', description: 'Comfortable sedans for business and leisure' },
  { value: 'SUV', label: 'SUV', icon: 'truck', description: 'Spacious SUVs for families and adventure' },
  { value: 'LUXURY', label: 'Luxury', icon: 'gem', description: 'Premium vehicles for executive travel' },
  { value: 'VAN', label: 'Van', icon: 'bus', description: 'Vans for group transport and cargo' },
  { value: 'MINIBUS', label: 'Minibus', icon: 'bus', description: 'Minibuses for medium-sized groups' },
  { value: 'COASTER', label: 'Coaster', icon: 'bus', description: 'Coasters for larger group travel' },
  { value: 'HIGHLACE', label: 'Hiace', icon: 'bus', description: 'Toyota Hiace for group transport' },
  { value: 'PICKUP', label: 'Pickup', icon: 'truck', description: 'Pickup trucks for cargo and utility' },
];

export interface RentalTypeInfo {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export const RENTAL_TYPES: RentalTypeInfo[] = [
  { value: 'SELF_DRIVE', label: 'Self Drive', description: 'Drive the vehicle yourself', icon: 'steering-wheel' },
  { value: 'CHAUFFEUR', label: 'With Driver', description: 'Professional chauffeur included', icon: 'user' },
  { value: 'AIRPORT_TRANSFER', label: 'Airport Transfer', description: 'Airport pickup and drop-off', icon: 'plane' },
  { value: 'CORPORATE', label: 'Corporate', description: 'Business transportation services', icon: 'briefcase' },
  { value: 'OTHER', label: 'Other', description: 'Custom rental requirements', icon: 'settings' },
];

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Vehicles', href: '/vehicles' },
  { label: 'Services', href: '/services', children: [
    { label: 'Self Drive', href: '/self-drive' },
    { label: 'Chauffeur Service', href: '/chauffeur-service' },
    { label: 'Airport Transfers', href: '/airport-transfers' },
    { label: 'Corporate Travel', href: '/corporate-travel' },
    { label: 'Intercity Travel', href: '/intercity-travel' },
    { label: 'Family Travel', href: '/family-travel' },
    { label: 'Event Transportation', href: '/event-transportation' },
    { label: 'Commercial Vehicle Rental', href: '/commercial-vehicle-rental' },
  ]},
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: 'layout-dashboard' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'calendar' },
  { label: 'Vehicles', href: '/admin/vehicles', icon: 'car' },
  { label: 'Services', href: '/admin/services', icon: 'list' },
  { label: 'Blog', href: '/admin/blog', icon: 'file-text' },
  { label: 'Customers', href: '/admin/customers', icon: 'users' },
  { label: 'Messages', href: '/admin/messages', icon: 'mail' },
  { label: 'Site Settings', href: '/admin/settings', icon: 'settings' },
  { label: 'SEO Settings', href: '/admin/seo', icon: 'search' },
  { label: 'Admin Users', href: '/admin/users', icon: 'user-cog' },
];