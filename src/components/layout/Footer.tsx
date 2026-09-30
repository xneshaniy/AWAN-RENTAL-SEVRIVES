import Link from 'next/link';
import { Car, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { WHATSAPP_CONFIG_HINT, getWhatsAppUrl, generateGeneralWhatsAppMessage } from '@/lib/whatsapp';
import type { getBusinessInfo } from '@/lib/settings';

interface FooterProps {
  businessInfo?: Awaited<ReturnType<typeof getBusinessInfo>>;
}

export function Footer({ businessInfo }: FooterProps) {
  const companyName = businessInfo?.companyName || 'Awan Rental Service';
  const phone = businessInfo?.companyPhone || '';
  const email = businessInfo?.companyEmail || '';
  const address = businessInfo?.companyAddress || '';
  const social = businessInfo?.social || {
    facebook: '',
    instagram: '',
    linkedin: '',
  };

  const whatsappUrl = getWhatsAppUrl(generateGeneralWhatsAppMessage());

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    quick: [
      { label: 'Home', href: '/' },
      { label: 'Vehicles', href: '/vehicles' },
      { label: 'Services', href: '/services' },
      { label: 'Self Drive', href: '/self-drive' },
      { label: 'Chauffeur Service', href: '/chauffeur-service' },
      { label: 'Airport Transfers', href: '/airport-transfers' },
      { label: 'Corporate Travel', href: '/corporate-travel' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    services: [
      { label: 'Self Drive Rental', href: '/self-drive' },
      { label: 'Chauffeur Service', href: '/chauffeur-service' },
      { label: 'Airport Transfers', href: '/airport-transfers' },
      { label: 'Corporate Transportation', href: '/corporate-travel' },
      { label: 'Car Rental Islamabad', href: '/car-rental-islamabad' },
      { label: 'Car Rental Rawalpindi', href: '/car-rental-rawalpindi' },
      { label: 'Car Rental Lahore', href: '/car-rental-lahore' },
      { label: 'Commercial Vehicles', href: '/vehicles?category=COMMERCIAL' },
    ],
    contact: [
      ...(phone ? [{ label: 'Phone', display: phone, href: `tel:${phone}`, icon: Phone }] : []),
      whatsappUrl
        ? { label: 'WhatsApp', display: 'Chat on WhatsApp', href: whatsappUrl, icon: MessageCircle, external: true }
        : { label: 'WhatsApp', display: 'WhatsApp (not configured)', href: null, icon: MessageCircle },
      ...(email ? [{ label: 'Email', display: email, href: `mailto:${email}`, icon: Mail }] : []),
      ...(address ? [{ label: 'Address', display: address, href: '/contact', icon: MapPin }] : []),
    ],
  };

  const socialLinks = [
    { label: 'Facebook', url: social.facebook, icon: Facebook },
    { label: 'Instagram', url: social.instagram, icon: Instagram },
    { label: 'LinkedIn', url: social.linkedin, icon: Linkedin },
  ].filter((item) => item.url);

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label={`${companyName} Home`}>
              <Car className="w-8 h-8 text-primary-400" aria-hidden="true" />
              <span className="font-heading font-bold text-xl text-white">{companyName}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your trusted partner for car rental and ground transportation services across Pakistan.
              Comfortable vehicles, professional service, and flexible rental options.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('text-gray-400 hover:text-white transition-colors', 'w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center')}
                    aria-label={item.label}
                  >
                    <item.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.quick.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Our Services</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.contact.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      <link.icon className="w-5 h-5 flex-shrink-0 text-primary-400" aria-hidden="true" />
                      <span>{link.display}</span>
                    </a>
                  ) : (
                    <span
                      className="flex items-center gap-3 text-gray-500 cursor-not-allowed text-sm"
                      title={WHATSAPP_CONFIG_HINT}
                    >
                      <link.icon className="w-5 h-5 flex-shrink-0 text-primary-400" aria-hidden="true" />
                      <span>{link.display}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} {companyName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <WhatsAppButton size="sm" label="WhatsApp" />
              <a
                href="/contact"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}