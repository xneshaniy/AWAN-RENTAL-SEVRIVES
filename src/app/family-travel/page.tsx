import { Metadata } from 'next';
import { ServiceLanding } from '@/components/services/ServiceLanding';

export const metadata: Metadata = {
  title: 'Family Travel & Vacation Car Rental',
  description:
    'Spacious SUVs, vans, and minibuses for family trips and vacations in Pakistan, available with self-drive or chauffeur options and child safety seats on request.',
  alternates: { canonical: '/family-travel' },
};

export default function FamilyTravelPage() {
  return (
    <ServiceLanding
      slug="family-travel"
      headline="Travel Together as a Family"
      whatsappLabel="Family Travel"
      featuresTitle="Family Travel Options"
      featuresIntro="Vehicle and rental options that suit trips with children and luggage."
      checklistTitle="Book for the Whole Family"
      checklistIntro="Tell us about your group when you book so there is enough room for every passenger and every bag."
      checklist={[
        'How many adults and children are travelling.',
        'Whether you need child safety seats — mention this when booking.',
        'How much luggage each passenger is bringing.',
        'Your trip type: a day out, a holiday, or a family event.',
      ]}
      ctaTitle="Plan Your Family Trip"
      ctaText="Check the vehicles that fit your group size, or message us with your dates and we will help you choose."
      vehicleCategories={['SUV', 'VAN', 'MINIBUS', 'COASTER', 'HIGHLACE']}
      vehicleTitle="Spacious Vehicles for Families"
    />
  );
}
