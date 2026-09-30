'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Car, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { MAIN_NAV } from '@/types';

interface HeaderProps {
  businessInfo?: Awaited<ReturnType<typeof import('@/lib/settings').getBusinessInfo>>;
}

export function Header({ businessInfo }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const businessPhone = businessInfo?.companyPhone || '';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = MAIN_NAV.filter(item => item.href !== '/admin');

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2" aria-label="Awan Rental Service Home">
            <Car className="w-8 h-8 text-primary-600" aria-hidden="true" />
            <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">
              Awan Rental Service
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <ul className="flex items-center gap-6" role="menubar">
              {navItems.map((item) => (
                <li key={item.href} role="none">
                  {item.children ? (
                    <div className="relative group">
                      <button
                        className={cn(
                          'flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400',
                          'font-medium text-sm transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-2 py-1'
                        )}
                        role="menuitem"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        {item.label}
                        <span className="w-4 h-4" aria-hidden="true">▼</span>
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <ul className="py-1" role="menu">
                          {item.children?.map((child) => (
                            <li key={child.href} role="none">
                              <Link
                                href={child.href}
                                className={cn(
                                  'block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                                  'text-sm transition-colors',
                                  'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700'
                                )}
                                role="menuitem"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400',
                        'font-medium text-sm transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-2 py-1'
                      )}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 ml-4">
              {businessPhone && (
                <a
                  href={`tel:${businessPhone}`}
                  className="hidden sm:flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">{businessPhone}</span>
                </a>
              )}
              <WhatsAppButton
                size="md"
                label="WhatsApp"
                ariaLabel="Chat with Awan Rental Service on WhatsApp"
                className="hidden sm:inline-flex"
              />
              <Button size="md" asChild className="hidden sm:inline-flex">
                <Link href="/booking">Book a Car</Link>
              </Button>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <WhatsAppButton
              variant="ghost"
              size="sm"
              iconOnly
              ariaLabel="Chat with Awan Rental Service on WhatsApp"
              className="p-2 text-green-600"
            />
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)} className="p-2">
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 animate-slide-down">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/" className="flex items-center gap-2">
                <Car className="w-8 h-8 text-primary-600" />
                <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                  Awan Rental Service
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4" role="navigation" aria-label="Mobile menu">
              <div className="space-y-1 mb-6">
                {navItems.map((item) => (
                  <div key={item.href}>
                    {item.children ? (
                      <div className="space-y-1">
                        <button className="w-full text-left px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between">
                          {item.label}
                          <span className="w-5 h-5">▼</span>
                        </button>
                        <div className="ml-4 space-y-1 mt-1">
                          {item.children?.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="block px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                {businessPhone && (
                  <a
                    href={`tel:${businessPhone}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <Phone className="w-6 h-6" aria-hidden="true" />
                    <span className="font-medium">{businessPhone}</span>
                  </a>
                )}
                <WhatsAppButton
                  variant="whatsapp"
                  size="lg"
                  fullWidth
                  label="WhatsApp Us"
                  ariaLabel="Chat with Awan Rental Service on WhatsApp"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <Button size="lg" fullWidth asChild>
                  <Link href="/booking" onClick={() => setIsMobileMenuOpen(false)}>Book a Car</Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}