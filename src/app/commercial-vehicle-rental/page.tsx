import { Metadata } from 'next';
import { ServiceLanding } from '@/components/services/ServiceLanding';

export const metadata: Metadata = {
  title: 'Commercial Vehicle Rental for Business and Groups',
  description:
    'Vans, hiace, and coasters for staff transport, group movement, and commercial use — available for daily, weekly, or monthly rental periods in Pakistan.',
  alternates: { canonical: '/commercial-vehicle-rental' },
};

export default function CommercialVehicleRentalPage() {
  return (
    <ServiceLanding
      slug="commercial-vehicle-rental"
      headline="Commercial Vehicle Rental"
      whatsappLabel="Commercial Vehicle Rental"
      featuresTitle="Vehicles for Business and Group Use"
      featuresIntro="Options to consider when arranging transport for staff, teams, or large groups."
      checklistTitle="Arrange a Commercial Rental"
      checklistIntro="Give us the following details so the vehicle and rental period match your requirement."
      checklist={[
        'The dates and schedule the vehicles are needed for.',
        'The number of passengers and luggage to be carried.',
        'The rental period: daily, weekly, or monthly.',
        'Whether you need drivers or will drive the vehicles yourselves.',
      ]}
      ctaTitle="Request a Commercial Vehicle"
      ctaText="Browse the vans and larger vehicles available, or message us with your requirement and we will confirm what can be arranged."
      vehicleCategories={['VAN', 'MINIBUS', 'COASTER', 'HIGHLACE', 'PICKUP']}
      vehicleTitle="Vans and Commercial Vehicles"
    />
  );
}
