'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
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
  const [openServices, setOpenServices] = useState(false);
  const businessPhone = businessInfo?.companyPhone || '';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navItems = MAIN_NAV.filter(item => item.href !== '/admin');

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white dark:bg-secondary-950 border-b border-border shadow-sm'
          : 'bg-white dark:bg-secondary-950 border-b border-border'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo lockup: user's actual brand logo image + live wordmark. */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
            aria-label="Awan Rental Service Home"
          >
            <img
              src="/icon-192.png"
              alt=""
              width="192"
              height="192"
              className="h-12 w-auto shrink-0 sm:h-14 lg:h-16"
              loading="eager"
              decoding="async"
            />
            <span className="flex min-w-0 flex-col justify-center">
              <span className="whitespace-nowrap font-heading text-[15px] font-bold leading-[1.05] tracking-[-0.015em] text-primary-900 dark:text-white min-[360px]:text-[16px] sm:text-[17px] lg:text-[18px] xl:text-[19px]">
                Awan Rental Service
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-secondary-500 dark:text-secondary-300 sm:text-[10px] lg:text-[11px]">
                <span className="h-1 w-1 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                Car Rental Pakistan
              </span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-5 xl:gap-6">
            <ul className="flex items-center gap-4 xl:gap-5" role="menubar">
              {navItems.map((item) => (
                <li key={item.href} role="none">
                  {item.children ? (
                    <div className="relative group">
                      <button
                        className={cn(
                          'flex items-center gap-1.5 text-foreground hover:text-primary hover:border-b-2 border-b-primary pb-1',
                          'font-medium text-sm transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2'
                        )}
                        role="menuitem"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        {item.label}
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-56 bg-card text-card-foreground rounded-xl shadow-xl border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60]">
                        <ul className="py-1" role="menu">
                          {item.children?.map((child) => (
                            <li key={child.href} role="none">
                              <Link
                                href={child.href}
                                className={cn(
                                  'block px-4 py-2.5 text-foreground hover:bg-accent hover:text-accent-foreground',
                                  'text-sm transition-colors',
                                  'focus:outline-none focus:bg-accent focus:text-accent-foreground'
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
                        'text-foreground hover:text-primary',
                        'font-medium text-sm transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1'
                      )}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 ml-2">
              {businessPhone && (
                <a
                  href={`tel:${businessPhone}`}
                  className="hidden xl:flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium text-xs">{businessPhone}</span>
                </a>
              )}
              <WhatsAppButton
                size="sm"
                iconOnly
                ariaLabel="Chat with Awan Rental Service on WhatsApp"
                className="hidden xl:inline-flex"
              />
              <Button variant="gold" size="md" asChild className="hidden xl:inline-flex px-4">
                <Link href="/booking">Book a Car</Link>
              </Button>
            </div>
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <WhatsAppButton
              variant="ghost"
              size="sm"
              iconOnly
              ariaLabel="Chat with Awan Rental Service on WhatsApp"
              className="p-2 text-accent"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="dialog"
            >
              <Menu className="w-6 h-6 text-foreground" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="xl:hidden fixed inset-0 z-50 bg-card border-b border-border"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 backdrop-blur-sm bg-black/10"
              aria-hidden="true"
            />
            <div
              className="relative flex flex-col h-full z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Link
                  href="/"
                  className="flex min-w-0 items-center gap-2"
                  aria-label="Awan Rental Service Home"
                  onClick={closeMenu}
                >
                  <img
                    src="/icon-192.png"
                    alt=""
                    width="192"
                    height="192"
                    className="h-9 w-auto shrink-0 sm:h-10"
                    loading="eager"
                    decoding="async"
                  />
                  <span className="min-w-0 truncate font-heading font-bold text-lg text-primary-900 dark:text-white sm:text-xl tracking-tight">
                    Awan Rental Service
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6 text-foreground" aria-hidden="true" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4" role="navigation" aria-label="Mobile menu">
                <div className="space-y-1 mb-6">
                  {navItems.map((item) => (
                    <div key={item.href}>
                      {item.children ? (
                        <div className="space-y-1">
                          <button
                            className="w-full text-left px-4 py-3 rounded-xl font-medium text-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-between transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenServices(!openServices);
                            }}
                            aria-expanded={openServices}
                          >
                            {item.label}
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-200 ${openServices ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </button>
                          {openServices && (
                            <div className="ml-4 space-y-1 mt-1 border-l-2 border-accent/40 pl-3">
                              {item.children?.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className="block px-4 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/50 text-sm transition-colors"
                                  onClick={closeMenu}
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="block px-4 py-3 rounded-xl font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {businessPhone && (
                    <a
                      href={`tel:${businessPhone}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 text-accent-foreground"
                      onClick={closeMenu}
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
                    onClick={closeMenu}
                  />
                  <Button variant="gold" size="lg" fullWidth asChild>
                    <Link href="/booking" onClick={closeMenu}>Book a Car</Link>
                  </Button>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
