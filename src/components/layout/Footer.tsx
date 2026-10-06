import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { WHATSAPP_CONFIG_HINT, getWhatsAppUrl, generateGeneralWhatsAppMessage } from '@/lib/whatsapp';
import { LEGAL_LINKS } from '@/config/site';
import type { getBusinessInfo } from '@/lib/settings';

interface FooterProps {
  businessInfo?: Awaited<ReturnType<typeof getBusinessInfo>>;
}

export function Footer({ businessInfo }: FooterProps) {
  const companyName = businessInfo?.companyName || 'Awan Rental Service';
  const phone = businessInfo?.companyPhone || '';
  const email = businessInfo?.companyEmail || '';
  const address = businessInfo?.companyAddress || '';
  const businessHours = businessInfo?.businessHours || '';
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
      { label: 'FAQ', href: '/faq' },
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
    // pb on mobile only: the fixed booking bar overlays the bottom of the
    // viewport, so the copyright row needs room to clear it.
    <footer className="bg-gray-900 text-gray-300 pb-24 sm:pb-0" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 inline-flex" aria-label={`${companyName} Home`}>
              <Logo className="h-32 w-auto rounded-2xl" />
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
                      className="flex items-center gap-3 text-gray-400 cursor-not-allowed text-sm"
                      title={WHATSAPP_CONFIG_HINT}
                    >
                      <link.icon className="w-5 h-5 flex-shrink-0 text-primary-400" aria-hidden="true" />
                      <span>{link.display}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {businessHours && (
              <div className="mt-6 border-t border-gray-800 pt-4">
                <p className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Opening Hours
                </p>
                <p className="whitespace-pre-line text-sm text-gray-400">{businessHours}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <nav
            aria-label="Legal"
            className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
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