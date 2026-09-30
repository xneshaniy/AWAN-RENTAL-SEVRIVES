import { Metadata } from 'next';
import { ServiceLanding } from '@/components/services/ServiceLanding';

export const metadata: Metadata = {
  title: 'Intercity Travel & City-to-City Car Rental',
  description:
    'Travel between Islamabad, Rawalpindi, Lahore, Murree and other cities in Pakistan with self-drive or chauffeur-driven vehicles. Book intercity travel online or on WhatsApp.',
  alternates: { canonical: '/intercity-travel' },
};

export default function IntercityTravelPage() {
  return (
    <ServiceLanding
      slug="intercity-travel"
      headline="Intercity Travel, City to City"
      whatsappLabel="Intercity Travel"
      featuresTitle="Travelling Between Cities"
      featuresIntro="What to expect when you plan an intercity journey with us."
      checklistTitle="Plan Your Intercity Trip"
      checklistIntro="Share these details when you book so we can match the right vehicle and schedule to your journey."
      checklist={[
        'Your travel dates and approximate departure time.',
        'The pickup point and the destination you are travelling to.',
        'The number of passengers and how much luggage you are carrying.',
        'Whether you want to drive yourself or travel with a chauffeur.',
      ]}
      ctaTitle="Book Your Intercity Journey"
      ctaText="Browse the vehicles available for your route, or message us with your dates and destinations and we will confirm what can be arranged."
      vehicleTitle="Vehicles for Intercity Travel"
    />
  );
}
