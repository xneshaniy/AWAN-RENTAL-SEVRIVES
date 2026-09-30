import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Airport Transfers in Pakistan',
  description:
    'Book airport pickup and drop-off for Islamabad International Airport, Lahore Allama Iqbal International Airport, and Rawalpindi / Islamabad. Share your flight number and vehicle preference when you request a transfer.',
  alternates: { canonical: '/airport-transfers' },
};

export default function AirportTransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}