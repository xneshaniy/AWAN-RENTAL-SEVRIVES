import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corporate Car Rental & Transportation in Pakistan',
  description: 'Professional corporate transportation services for companies, executives, and business travelers. Employee transport, airport transfers, meetings, and events across Pakistan.',
  alternates: { canonical: '/corporate-travel' },
};

export default function CorporateTravelLayout({ children }: { children: React.ReactNode }) {
  return children;
}