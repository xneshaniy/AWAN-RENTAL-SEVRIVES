'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

/**
 * PWA Install Prompt Component
 * 
 * Handles the beforeinstallprompt event and provides an install button
 * when the app can be installed. Automatically hides when:
 * - App is already installed (standalone mode)
 * - Browser doesn't support PWA installation
 * - User dismissed the prompt
 */

interface InstallPromptProps {
  /** Custom className for the button container */
  className?: string;
  /** Show as compact button (icon only) or full button with text */
  compact?: boolean;
  /** Callback when installation is successful */
  onInstall?: () => void;
  /** Callback when user dismisses the prompt */
  onDismiss?: () => void;
}

export function InstallPrompt({
  className,
  compact = false,
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Check if app is already installed (standalone mode)
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandaloneIOS = (window.navigator as any).standalone === true;
    
    setIsInstalled(standalone || isStandaloneIOS);
    setIsIOS(isIOSDevice);

    // Check localStorage for dismissal
    const dismissedStorage = localStorage.getItem('pwa-install-dismissed');
    if (dismissedStorage) {
      try {
        const { timestamp } = JSON.parse(dismissedStorage);
        // Re-show after 30 days
        if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
          setDismissed(true);
        }
      } catch {
        // Invalid storage, ignore
      }
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  // Trigger the install prompt
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onInstall?.();
      } else {
        // User dismissed - don't show again for a while
        setDismissed(true);
        localStorage.setItem('pwa-install-dismissed', JSON.stringify({ timestamp: Date.now() }));
        onDismiss?.();
      }
    } catch (error) {
      console.error('PWA install failed:', error);
    }
  }, [deferredPrompt, onInstall, onDismiss]);

  // Don't show if already installed, dismissed, or no prompt available
  if (isInstalled || dismissed || !deferredPrompt) {
    return null;
  }

  // iOS-specific instructions (since iOS doesn't support beforeinstallprompt)
  if (isIOS) {
    return (
      <div className={cn('fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-80 z-50', className)}>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
              <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white">
                Install ARS Admin
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tap the Share button, then Add to Home Screen for quick access.
              </p>
            </div>
            <button
              onClick={() => {
                setDismissed(true);
                localStorage.setItem('pwa-install-dismissed', JSON.stringify({ timestamp: Date.now() }));
                onDismiss?.();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard install button for Android/Chrome
  return (
    <div className={cn('fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-80 z-50', className)}>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
            <Download className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white">
              Install ARS Admin
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add to home screen for quick access
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDismissed(true);
                localStorage.setItem('pwa-install-dismissed', JSON.stringify({ timestamp: Date.now() }));
                onDismiss?.();
              }}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Dismiss</span>
            </Button>
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="flex-shrink-0"
            >
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Install</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}