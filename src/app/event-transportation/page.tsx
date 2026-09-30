import { Metadata } from 'next';
import { ServiceLanding } from '@/components/services/ServiceLanding';

export const metadata: Metadata = {
  title: 'Event Transportation & Group Vehicle Hire',
  description:
    'Vehicle arrangements for weddings, conferences, seminars, and corporate events. Vans, coasters, and minibuses coordinated around your event schedule across Pakistan.',
  alternates: { canonical: '/event-transportation' },
};

export default function EventTransportationPage() {
  return (
    <ServiceLanding
      slug="event-transportation"
      headline="Transportation for Events and Occasions"
      whatsappLabel="Event Transportation"
      featuresTitle="Vehicle Arrangements for Events"
      featuresIntro="How we structure transport for weddings, conferences, and gatherings."
      checklistTitle="Arrange Transport for Your Event"
      checklistIntro="Event transport depends on timing and guest logistics, so share the following when you enquire."
      checklist={[
        'The event date, start time, and expected finish time.',
        'Pickup and drop-off points for guests or attendees.',
        'The approximate number of passengers to be moved.',
        'Whether the vehicles should be self-drive or chauffeur-driven.',
      ]}
      ctaTitle="Plan Your Event Transport"
      ctaText="Message us with your event details and we will outline what vehicles can be arranged for your dates."
      vehicleTitle="Vehicles for Events and Groups"
    />
  );
}
