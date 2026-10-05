'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Scroll distance before the button appears - past the fold of any viewport. */
const SHOW_AFTER_PX = 480;

/**
 * Floating back-to-top control.
 *
 * Positioned bottom-left so it never collides with the WhatsApp launcher
 * (bottom-right) or the mobile booking bar. Hidden until the visitor has
 * actually scrolled, and uses an instant jump when the visitor has asked
 * their system to reduce motion.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-24 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800/95 dark:text-gray-300 dark:hover:text-primary-400 sm:bottom-6 sm:left-6"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
