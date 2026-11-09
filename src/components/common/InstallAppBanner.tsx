'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

/**
 * Public-site PWA install banner.
 *
 * Invites visitors to install "Awan Rental Service" on their phone.
 * - Android/Chrome: captures `beforeinstallprompt`, shows an Install button.
 * - iOS/Safari: shows manual Share → "Add to Home Screen" instructions.
 * - Already installed / dismissed: renders nothing.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppBanner({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(standalone || iosStandalone);
    setIsIOS(iOS);

    try {
      const stored = localStorage.getItem('public-install-dismissed');
      if (stored) {
        const { timestamp } = JSON.parse(stored) as { timestamp: number };
        if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) setDismissed(true);
      }
    } catch {
      // ignore unreadable storage
    }
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      } else {
        setDismissed(true);
        localStorage.setItem('public-install-dismissed', JSON.stringify({ timestamp: Date.now() }));
      }
    } catch {
      // user dismissed or prompt failed
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem('public-install-dismissed', JSON.stringify({ timestamp: Date.now() }));
    } catch {
      // ignore
    }
  }, []);

  if (isInstalled || dismissed || (!deferredPrompt && !isIOS)) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-40',
        className
      )}
      role="dialog"
      aria-label="Install the app"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-primary-100 dark:border-primary-900 bg-white dark:bg-gray-900 shadow-2xl p-3 sm:p-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-primary-900 dark:bg-primary-800">
          {isIOS ? (
            <Share className="h-6 w-6 text-accent-500" aria-hidden="true" />
          ) : (
            <Smartphone className="h-6 w-6 text-accent-500" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm sm:text-base font-semibold text-primary-900 dark:text-white leading-snug">
            Install Awan Rental Service
          </p>
          {isIOS ? (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">
              Tap <Share className="inline h-4 w-4 align-[-2px]" aria-hidden="true" /> then
              <strong> Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">
              Add to your home screen for quick access
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {!isIOS && (
            <Button size="sm" variant="gold" onClick={handleInstall} className="shrink-0">
              <Download className="h-4 w-4 mr-1" aria-hidden="true" />
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
