import { PrismaClient, VehicleCategory, Transmission, FuelType, Role, SettingType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Verified business configuration (keep in sync with src/config/site.ts / .env.example)
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://awanrentalservice.org').replace(/\/+$/, '');
const COMPANY_NAME = 'AWAN RENTAL SERVICE';
const COMPANY_PHONE = '+92 305 6846811';
const COMPANY_WHATSAPP = '+923056846811';
const COMPANY_EMAIL = 'info@awanrentalservice.org';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || COMPANY_EMAIL;

async function main() {
  console.log('🌱 Seeding database...');

  // `--blog-only` seeds just the unpublished blog draft ideas without
  // touching vehicles, settings, services or FAQs (safe for a live DB).
  if (process.argv.includes('--blog-only')) {
    await seedBlogIdeas();
    return;
  }

  // Create admin user (email comes from ADMIN_EMAIL so it matches .env)
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'Administrator',
      password: adminPassword,
      role: Role.ADMIN,
      phone: COMPANY_WHATSAPP,
      city: 'Islamabad',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo vehicles (mark as demo data)
  const vehicles = [
    {
      name: 'Toyota Corolla (Demo)',
      slug: 'toyota-corolla-demo',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2023,
      category: VehicleCategory.SEDAN,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 4,
      luggageCapacity: 3,
      dailyRate: 12000,
      weeklyRate: 75000,
      monthlyRate: 280000,
      description: 'Demo vehicle - The Toyota Corolla is a reliable and fuel-efficient sedan perfect for city driving and intercity travel. Features modern amenities and comfortable seating for 5 passengers.',
      features: ['Air Conditioning', 'Power Windows', 'Central Locking', 'ABS Brakes', 'Airbags', 'Bluetooth', 'USB Port', 'Reverse Camera'],
      images: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      location: 'Islamabad',
      mileage: 15000,
      licensePlate: 'ISB-123-ABC',
    },
    {
      name: 'Toyota Yaris (Demo)',
      slug: 'toyota-yaris-demo',
      brand: 'Toyota',
      model: 'Yaris',
      year: 2023,
      category: VehicleCategory.ECONOMY,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 4,
      luggageCapacity: 2,
      dailyRate: 9000,
      weeklyRate: 55000,
      monthlyRate: 200000,
      description: 'Demo vehicle - The Toyota Yaris is a compact and economical hatchback ideal for city commuting. Great fuel efficiency with modern features.',
      features: ['Air Conditioning', 'Power Windows', 'Central Locking', 'ABS Brakes', 'Airbags', 'Touchscreen Display', 'Apple CarPlay', 'Android Auto'],
      images: [
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      location: 'Islamabad',
      mileage: 12000,
      licensePlate: 'ISB-456-DEF',
    },
    {
      name: 'Honda Civic (Demo)',
      slug: 'honda-civic-demo',
      brand: 'Honda',
      model: 'Civic',
      year: 2024,
      category: VehicleCategory.SEDAN,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 4,
      luggageCapacity: 4,
      dailyRate: 15000,
      weeklyRate: 95000,
      monthlyRate: 350000,
      description: 'Demo vehicle - The Honda Civic offers premium comfort with advanced safety features and a sophisticated interior. Perfect for business and leisure travel.',
      features: ['Air Conditioning', 'Climate Control', 'Leather Seats', 'Sunroof', 'Honda Sensing', 'Wireless Charging', 'Premium Audio', 'Keyless Entry'],
      images: [
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      location: 'Islamabad',
      mileage: 8000,
      licensePlate: 'ISB-789-GHI',
    },
    {
      name: 'Toyota Fortuner (Demo)',
      slug: 'toyota-fortuner-demo',
      brand: 'Toyota',
      model: 'Fortuner',
      year: 2023,
      category: VehicleCategory.SUV,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 7,
      doors: 5,
      luggageCapacity: 5,
      dailyRate: 25000,
      weeklyRate: 160000,
      monthlyRate: 600000,
      description: 'Demo vehicle - The Toyota Fortuner is a premium 7-seater SUV built for both city roads and off-road adventures. Perfect for family trips to northern areas.',
      features: ['Air Conditioning', 'Climate Control', 'Leather Seats', '4WD', 'Cruise Control', 'JBL Audio', 'Wireless Charging', 'Power Tailgate', 'Terrain Modes'],
      images: [
        'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      location: 'Islamabad',
      mileage: 25000,
      licensePlate: 'ISB-101-JKL',
    },
    {
      name: 'Toyota Hiace (Demo)',
      slug: 'toyota-hiace-demo',
      brand: 'Toyota',
      model: 'Hiace',
      year: 2022,
      category: VehicleCategory.HIGHLACE,
      transmission: Transmission.MANUAL,
      fuelType: FuelType.DIESEL,
      seats: 13,
      doors: 4,
      luggageCapacity: 8,
      dailyRate: 30000,
      weeklyRate: 190000,
      monthlyRate: 700000,
      description: 'Demo vehicle - The Toyota Hiace is a spacious 13-seater van ideal for group travel, corporate transport, and airport transfers. Comfortable seating with ample luggage space.',
      features: ['Air Conditioning', 'Reclining Seats', 'Individual Reading Lights', 'Luggage Racks', 'PA System', 'USB Ports', 'Curtains', 'First Aid Kit'],
      images: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: false,
      location: 'Islamabad',
      mileage: 45000,
      licensePlate: 'ISB-202-MNO',
    },
    {
      name: 'Suzuki Cultus (Demo)',
      slug: 'suzuki-cultus-demo',
      brand: 'Suzuki',
      model: 'Cultus',
      year: 2023,
      category: VehicleCategory.ECONOMY,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 4,
      luggageCapacity: 2,
      dailyRate: 8000,
      weeklyRate: 50000,
      monthlyRate: 180000,
      description: 'Demo vehicle - The Suzuki Cultus is an affordable and fuel-efficient compact car perfect for daily commuting and short trips.',
      features: ['Air Conditioning', 'Power Windows', 'Central Locking', 'ABS Brakes', 'Airbags', 'Bluetooth', 'Keyless Entry'],
      images: [
        'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: false,
      location: 'Rawalpindi',
      mileage: 18000,
      licensePlate: 'RWP-303-PQR',
    },
    {
      name: 'Kia Sportage (Demo)',
      slug: 'kia-sportage-demo',
      brand: 'Kia',
      model: 'Sportage',
      year: 2024,
      category: VehicleCategory.SUV,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seats: 5,
      doors: 5,
      luggageCapacity: 4,
      dailyRate: 22000,
      weeklyRate: 140000,
      monthlyRate: 520000,
      description: 'Demo vehicle - The Kia Sportage is a modern compact SUV with premium features, advanced safety systems, and stylish design.',
      features: ['Air Conditioning', 'Climate Control', 'Leather Seats', 'Panoramic Sunroof', 'ADAS', 'Wireless Charging', 'Bose Audio', 'Heated Seats', '360 Camera'],
      images: [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      isAvailable: true,
      isFeatured: true,
      location: 'Lahore',
      mileage: 5000,
      licensePlate: 'LHR-404-STU',
    },
    {
      name: 'Toyota Coaster (Demo)',
      slug: 'toyota-coaster-demo',
      brand: 'Toyota',
      model: 'Coaster',
      year: 2022,
      category: VehicleCategory.COASTER,
      transmission: Transmission.MANUAL,
      fuelType: FuelType.DIESEL,
      seats: 29,
      doors: 2,
      luggageCapacity: 15,
      description: 'Demo vehicle - The Toyota Coaster is a 29-seater minibus perfect for large group travel, corporate events, school trips, and weddings.',
      features: ['Air Conditioning', 'Reclining Seats', 'Overhead Luggage', 'PA System', 'Emergency Exits', 'Fire Extinguisher', 'First Aid Kit', 'Reading Lights'],
      images: [
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=600&fit=crop',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=300&fit=crop',
      // Pricing intentionally not configured: the public pages must show
      // "Request a Quote" instead of a price for this vehicle.
      dailyRate: 0,
      weeklyRate: null,
      monthlyRate: null,
      isAvailable: true,
      isFeatured: false,
      location: 'Islamabad',
      mileage: 80000,
      licensePlate: 'ISB-505-VWX',
    },
  ];

  // Rental options rendered on the public vehicle detail pages.
  // Demo data - editable later from Admin > Vehicles.
  const rentalOptions: Record<string, {
    selfDriveAvailable?: boolean;
    chauffeurAvailable?: boolean;
    unlimitedKilometers?: boolean;
    kilometerLimit?: number | null;
  }> = {
    'toyota-corolla-demo': { selfDriveAvailable: true, chauffeurAvailable: true, unlimitedKilometers: false, kilometerLimit: 300 },
    'toyota-yaris-demo': { selfDriveAvailable: true, chauffeurAvailable: true, unlimitedKilometers: false, kilometerLimit: 300 },
    'honda-civic-demo': { selfDriveAvailable: true, chauffeurAvailable: true, unlimitedKilometers: false, kilometerLimit: 300 },
    'toyota-fortuner-demo': { selfDriveAvailable: true, chauffeurAvailable: true, unlimitedKilometers: false, kilometerLimit: 400 },
    'toyota-hiace-demo': { selfDriveAvailable: false, chauffeurAvailable: true, unlimitedKilometers: true },
    'suzuki-cultus-demo': { selfDriveAvailable: true, chauffeurAvailable: true, unlimitedKilometers: false, kilometerLimit: 300 },
    'kia-sportage-demo': { selfDriveAvailable: true, chauffeurAvailable: true, unlimitedKilometers: false, kilometerLimit: 400 },
    'toyota-coaster-demo': { selfDriveAvailable: false, chauffeurAvailable: true, unlimitedKilometers: true },
  };

  const rentalRequirements = [
    'Valid CNIC or Passport',
    'Valid driving licence (required for self-drive bookings)',
  ];

  for (const vehicle of vehicles) {
    const data = {
      ...vehicle,
      isDemo: true,
      ac: true,
      rentalRequirements,
      ...rentalOptions[vehicle.slug],
    };
    await prisma.vehicle.upsert({
      where: { slug: vehicle.slug },
      update: data,
      create: data,
    });
  }
  console.log('✅ Demo vehicles created');

  // Create site settings (verified business info; unavailable fields stay as
  // empty editable placeholders in Admin > Settings — do NOT invent values)
  const settings = [
    { key: 'company_name', value: COMPANY_NAME, type: 'STRING', group: 'business', label: 'Company Name', isPublic: true },
    { key: 'company_phone', value: COMPANY_PHONE, type: 'STRING', group: 'business', label: 'Company Phone', isPublic: true },
    { key: 'company_whatsapp', value: COMPANY_WHATSAPP, type: 'STRING', group: 'business', label: 'WhatsApp Number', isPublic: true },
    { key: 'company_email', value: COMPANY_EMAIL, type: 'STRING', group: 'business', label: 'Company Email', isPublic: true },
    { key: 'company_address', value: '8 C, Sector C DHA Phase 6, Lahore, 54792, Pakistan', type: 'STRING', group: 'business', label: 'Company Address', isPublic: true },
    { key: 'business_hours', value: '', type: 'TEXT', group: 'business', label: 'Business Hours', isPublic: true },
    { key: 'service_areas', value: '', type: 'TEXT', group: 'business', label: 'Service Areas (comma-separated)', isPublic: true },
    { key: 'facebook_url', value: 'https://www.facebook.com/share/19TkuS9sBu/', type: 'STRING', group: 'social', label: 'Facebook URL', isPublic: true },
    { key: 'instagram_url', value: 'https://www.instagram.com/awanrentalservice67?stkn=eWZndTJpZmJhMHcz', type: 'STRING', group: 'social', label: 'Instagram URL', isPublic: true },
    { key: 'google_maps_url', value: 'https://maps.app.goo.gl/L1JDX9VkTHFkVW4E9?g_st=ac', type: 'STRING', group: 'business', label: 'Google Maps URL', isPublic: true },
    { key: 'linkedin_url', value: '', type: 'STRING', group: 'social', label: 'LinkedIn URL', isPublic: true },
    { key: 'admin_email', value: ADMIN_EMAIL, type: 'STRING', group: 'business', label: 'Admin Notification Email', isPublic: false },
    { key: 'site_url', value: SITE_URL, type: 'STRING', group: 'business', label: 'Website URL', isPublic: true },
    { key: 'seo_title', value: `${COMPANY_NAME} - Car Rental & Transportation in Pakistan`, type: 'STRING', group: 'seo', label: 'SEO Title', isPublic: true },
    { key: 'seo_description', value: 'Professional car rental and ground transportation services in Islamabad, Rawalpindi, Lahore and nationwide Pakistan. Self-drive, chauffeur, airport transfers, and corporate travel.', type: 'TEXT', group: 'seo', label: 'SEO Description', isPublic: true },
    { key: 'og_image', value: '/hero.jpg', type: 'STRING', group: 'seo', label: 'Open Graph Image', isPublic: true },
    { key: 'whatsapp_number', value: COMPANY_WHATSAPP, type: 'STRING', group: 'whatsapp', label: 'WhatsApp Number', isPublic: false },
    { key: 'whatsapp_greeting', value: `Hello ${COMPANY_NAME}, I would like to inquire about your services.`, type: 'TEXT', group: 'whatsapp', label: 'Default Greeting', isPublic: false },
    { key: 'whatsapp_booking_template', value: '', type: 'TEXT', group: 'whatsapp', label: 'WhatsApp Booking Message Template (empty = default)', isPublic: false },
    { key: 'booking_hold_hours', value: '24', type: 'NUMBER', group: 'booking', label: 'Booking Hold Duration (hours)', isPublic: false },
    { key: 'pending_booking_hold_enabled', value: 'true', type: 'BOOLEAN', group: 'booking', label: 'Temporary Hold on Pending Bookings', isPublic: false },
    { key: 'min_rental_days', value: '1', type: 'NUMBER', group: 'booking', label: 'Minimum Rental Days', isPublic: false },
    { key: 'max_rental_days', value: '90', type: 'NUMBER', group: 'booking', label: 'Maximum Rental Days', isPublic: false },
    { key: 'default_booking_status', value: 'PENDING', type: 'STRING', group: 'booking', label: 'Default Booking Status', isPublic: false },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      // Re-seeding refreshes these keys to the verified configuration values.
      update: { value: setting.value },
      create: {
        ...setting,
        type: setting.type as SettingType,
      },
    });
  }
  console.log('✅ Site settings created');

  // Create services (drives the public /services page and the service detail pages)
  const services = [
    {
      name: 'Self Drive Car Rental',
      slug: 'self-drive',
      description: 'Our self-drive car rental options come with flexible rental arrangements, allowing you to focus on your journey rather than worrying about unnecessary restrictions. Depending on the selected vehicle and rental plan, you can pick up your rental or request delivery to your doorstep, office, or arrival airport.',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=500&fit=crop',
      icon: 'car',
      href: '/self-drive',
      order: 1,
      features: [
        { title: 'Flexible Rental Periods', description: 'Rent by the day, week, or month to match your plans.' },
        { title: 'Vehicle Choices', description: 'Economy cars, sedans, SUVs, and larger vehicles for different needs.' },
        { title: 'Pickup Options', description: 'Collect the vehicle yourself or request delivery when you book.' },
        { title: 'Driving Requirements', description: 'Bring a valid driving licence and your CNIC or passport when collecting the vehicle.' },
      ],
    },
    {
      name: 'Chauffeur Service',
      slug: 'chauffeur-service',
      description: 'Professional chauffeur-driven car rental for business meetings, executive travel, family trips, airport transfers, events, long-distance travel, and corporate transportation. Our experienced drivers ensure a safe and comfortable journey.',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop',
      icon: 'user',
      href: '/chauffeur-service',
      order: 2,
      features: [
        { title: 'Experienced Drivers', description: 'Drivers who know local routes and long-distance travel across Pakistan.' },
        { title: 'All Types of Trips', description: 'Airport runs, business meetings, family trips, and outstation journeys.' },
        { title: 'Planned Routes', description: 'Share your pickup point, destination, and schedule when booking.' },
        { title: 'Travel Without Driving', description: 'Sit back while the driver handles traffic, routes, and parking.' },
      ],
    },
    {
      name: 'Airport Transfers',
      slug: 'airport-transfers',
      description: 'Reliable airport pickup and drop-off services for Islamabad International Airport, Lahore Airport, and other major Pakistani airports. Flight monitoring included for timely service.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
      icon: 'plane',
      href: '/airport-transfers',
      order: 3,
      features: [
        { title: 'Major Airports', description: 'Transfers for Islamabad, Lahore, and other major airports in Pakistan.' },
        { title: 'Flight Details', description: 'Share your flight number when booking so arrivals can be planned.' },
        { title: 'Door-to-Door', description: 'Transfers between the airport and hotels, offices, or homes.' },
        { title: 'Space for Luggage', description: 'Vehicles matched to the number of passengers and bags.' },
      ],
    },
    {
      name: 'Corporate Transportation',
      slug: 'corporate-travel',
      description: 'Tailored transportation solutions for companies, executives, business travelers, corporate events, employee transportation, airport transfers, meetings, and conferences.',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=500&fit=crop',
      icon: 'building',
      href: '/corporate-travel',
      order: 4,
      features: [
        { title: 'Business Travel', description: 'Transport for executives, employees, and visiting guests.' },
        { title: 'Meetings and Events', description: 'Trips planned around meeting, conference, and event timings.' },
        { title: 'Single or Repeated Trips', description: 'Book one journey or arrange a repeating schedule.' },
        { title: 'Vehicle Range', description: 'Sedans, SUVs, and larger vehicles for staff or guest transport.' },
      ],
    },
    {
      name: 'Intercity Travel',
      slug: 'intercity-travel',
      description: 'Comfortable intercity travel between Islamabad, Rawalpindi, Lahore, Murree, Nathiagali, and other major Pakistani cities. Available with self-drive or chauffeur options.',
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
      icon: 'map-pin',
      href: '/intercity-travel',
      order: 5,
      features: [
        { title: 'City-to-City Travel', description: 'Journeys between Islamabad, Rawalpindi, Lahore, Murree, and other destinations.' },
        { title: 'Self-Drive or Chauffeur', description: 'Choose to drive yourself or travel with a driver.' },
        { title: 'Trip Planning', description: 'Set your pickup point, drop-off location, and dates when booking.' },
        { title: 'Passengers and Luggage', description: 'Vehicles selected around your group size and luggage.' },
      ],
    },
    {
      name: 'Family Travel',
      slug: 'family-travel',
      description: 'Spacious vehicles perfect for family trips and vacations. SUVs, vans, and minibuses available with child safety seats upon request.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=500&fit=crop',
      icon: 'users',
      href: '/family-travel',
      order: 6,
      features: [
        { title: 'Room for Everyone', description: 'SUVs, vans, and minibuses with space for passengers and luggage.' },
        { title: 'Child Safety Seats', description: 'Child seats are available on request when you book.' },
        { title: 'Self-Drive or Chauffeur', description: 'Drive yourselves or travel with a driver.' },
        { title: 'Trips of Any Length', description: 'Suitable for day outings, holidays, and family events.' },
      ],
    },
    {
      name: 'Event Transportation',
      slug: 'event-transportation',
      description: 'Transportation for weddings, corporate events, conferences, seminars, and other gatherings. Vehicles are arranged for guests and attendees according to group size, schedule, and route.',
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=500&fit=crop',
      icon: 'calendar',
      href: '/event-transportation',
      order: 7,
      features: [
        { title: 'Group Vehicles', description: 'Vans, coasters, and minibuses for moving guests together.' },
        { title: 'Scheduled Timing', description: 'Pickup and drop-off times planned around your event schedule.' },
        { title: 'Coordinated Pickups', description: 'Share pickup points and timings when you book.' },
        { title: 'With or Without a Driver', description: 'Arrange transport as self-drive or chauffeur-driven.' },
      ],
    },
    {
      name: 'Commercial Vehicle Rental',
      slug: 'commercial-vehicle-rental',
      description: 'Vans, hiace, and coasters available for staff transport, group movement, and other commercial requirements, arranged on daily, weekly, or monthly rental periods.',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop',
      icon: 'truck',
      href: '/commercial-vehicle-rental',
      order: 8,
      features: [
        { title: 'Group Capacity', description: 'Vans and coasters for moving teams or passengers together.' },
        { title: 'Flexible Periods', description: 'Daily, weekly, or monthly rental arrangements.' },
        { title: 'Passengers and Luggage', description: 'Choose a vehicle based on how many people and how much luggage you have.' },
        { title: 'Business Use', description: 'Suited to staff transport, site visits, and group travel.' },
      ],
    },
  ];

  for (const service of services) {
    const content = JSON.stringify({
      description: service.description,
      image: service.image,
      active: true,
      icon: service.icon,
      href: service.href,
      order: service.order,
      features: service.features,
    });
    await prisma.siteContent.upsert({
      where: { key: `service_${service.slug}` },
      update: { title: service.name, content },
      create: {
        key: `service_${service.slug}`,
        title: service.name,
        content,
      },
    });
  }
  console.log('✅ Services created');

  // Create FAQs
  const faqs = [
    { question: 'What documents do I need to rent a car?', answer: 'You need a valid driving license (Pakistani or International), CNIC/Passport, and a credit/debit card for security deposit.', category: 'Booking', order: 1 },
    { question: 'Can I rent a car with a driver?', answer: 'Yes, we offer chauffeur-driven services for all vehicle categories. Our professional drivers are experienced and knowledgeable about local routes.', category: 'Services', order: 2 },
    { question: 'Do you offer airport pickup and drop-off?', answer: 'Yes, we provide airport transfer services for Islamabad International Airport, Lahore Allama Iqbal International Airport, and other major airports in Pakistan.', category: 'Services', order: 3 },
    { question: 'What is included in the rental price?', answer: 'Rental price includes the vehicle, basic insurance, and 24/7 roadside assistance. Fuel, toll taxes, and driver allowance (if applicable) are extra.', category: 'Pricing', order: 4 },
    { question: 'Can I extend my rental period?', answer: 'Yes, you can extend your rental by contacting us at least 24 hours before your scheduled return. Extension is subject to vehicle availability.', category: 'Booking', order: 5 },
    { question: 'What is your cancellation policy?', answer: 'Free cancellation up to 24 hours before pickup. Cancellations within 24 hours may incur a fee. Please check your booking confirmation for details.', category: 'Booking', order: 6 },
    { question: 'Do you deliver vehicles to hotels or homes?', answer: 'Yes, we offer vehicle delivery and pickup service within Islamabad, Rawalpindi, and Lahore for an additional fee. Please request this at the time of booking.', category: 'Services', order: 7 },
    { question: 'Is there a mileage limit?', answer: 'Most rentals include generous daily mileage limits. Unlimited mileage options are available for select vehicles and rental plans. Please check the specific vehicle details.', category: 'Pricing', order: 8 },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.upsert({
      where: { id: `faq-${faq.order}` },
      update: {},
      create: {
        id: `faq-${faq.order}`,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        isActive: true,
      },
    });
  }
  console.log('✅ FAQs created');

  await seedBlogIdeas();
}

/**
 * Blog topic ideas - created as UNPUBLISHED drafts only. They are outlines
 * for a human editor to review, expand and verify before publishing.
 * `update: {}` means re-seeding never overwrites or publishes existing posts.
 */
async function seedBlogIdeas() {
  const blogIdeas = [
    {
      slug: 'guide-to-renting-a-car-in-pakistan',
      title: 'Guide to Renting a Car in Pakistan',
      excerpt:
        'A practical overview of what to consider when renting a car in Pakistan: documents, self-drive versus chauffeur options, and questions to ask before booking.',
      content: `Topic outline - expand and verify before publishing.

What this article should cover:

Documents and requirements typically asked for when renting a car in Pakistan.

How to choose between self-drive and chauffeur-driven rental depending on the trip.

Questions to ask before confirming a booking: what is included, mileage terms, fuel policy, and the cancellation terms that apply to your reservation.

Tips for inspecting the vehicle and documenting its condition at handover.

Note: all policy details must reflect the business's actual terms at the time of publishing.`,
    },
    {
      slug: 'driving-in-islamabad-what-visitors-should-know',
      title: 'Driving in Islamabad: What Visitors Should Know',
      excerpt:
        'What to expect behind the wheel in Islamabad: road network, traffic flow, and practical tips for visitors driving in the capital.',
      content: `Topic outline - expand and verify before publishing.

What this article should cover:

An overview of Islamabad's road network, grid layout and signal-free corridors.

General driving conditions and common courtesy expectations on the road.

How rush hours affect travel times across the city.

Parking considerations near markets, offices and visitor attractions.

A reminder that visitors should check current local traffic rules and requirements with the relevant authorities before driving.`,
    },
    {
      slug: 'islamabad-to-murree-travel-guide',
      title: 'Islamabad to Murree Travel Guide',
      excerpt:
        'Planning a trip from Islamabad to Murree: the route, seasonal considerations, and what to keep in mind for a comfortable hill journey.',
      content: `Topic outline - expand and verify before publishing.

What this article should cover:

The route from Islamabad to Murree - roughly 60 kilometres - and the roads commonly used.

Seasonal considerations: weather on the hills, winter snow and how it affects driving conditions.

Why travel time varies with traffic, especially on weekends and holidays.

Tips for a comfortable journey with family, including luggage and rest stops.

Note: confirm current road conditions and any seasonal restrictions before publishing.`,
    },
    {
      slug: 'airport-transfer-guide-for-islamabad',
      title: 'Airport Transfer Guide for Islamabad',
      excerpt:
        'What to know when planning an airport transfer to or from Islamabad International Airport: timing, luggage and pickup coordination.',
      content: `Topic outline - expand and verify before publishing.

What this article should cover:

What to share when booking a transfer: flight details, passenger count and luggage.

Why travel time to the airport should allow a generous buffer for traffic.

How pickup and drop-off coordination works on arrival.

Choosing a vehicle sized for the group and their luggage.

Note: airport availability claims must match the airports configured in business settings at the time of publishing.`,
    },
    {
      slug: 'self-drive-vs-chauffeur-driven-car-rental',
      title: 'Self-Drive vs Chauffeur-Driven Car Rental',
      excerpt:
        'Comparing self-drive and chauffeur-driven car rental: control, comfort, and how to choose based on route, budget and travel plans.',
      content: `Topic outline - expand and verify before publishing.

What this article should cover:

Self-drive: independence, privacy and what documents are typically required.

Chauffeur-driven: travelling without driving duties, useful for business and long routes.

How route, duration and group size influence the better choice.

A checklist of questions to ask before choosing either option.

Note: describe only services the business currently offers.`,
    },
  ];

  for (const idea of blogIdeas) {
    await prisma.blogPost.upsert({
      where: { slug: idea.slug },
      update: {},
      create: {
        title: idea.title,
        slug: idea.slug,
        excerpt: idea.excerpt,
        content: idea.content,
        featuredImage: null,
        category: 'Guides',
        tags: ['guide', 'pakistan'],
        isPublished: false,
        publishedAt: null,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: [],
        authorId: ADMIN_EMAIL,
      },
    });
  }
  console.log('✅ Blog draft ideas created (unpublished)');

  // NOTE: Office/branch locations are intentionally NOT seeded — we have no
  // verified addresses. Add them later in Admin > Settings (Locations).
  // NOTE: Testimonials are intentionally NOT seeded — we have no verified
  // customer reviews. Add real ones later in Admin (they appear only when added).

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });