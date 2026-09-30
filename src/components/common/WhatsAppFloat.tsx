'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WHATSAPP_CONFIG_HINT,
  generateGeneralWhatsAppMessage,
  generateServiceInquiryWhatsAppMessage,
  generateVehicleInquiryWhatsAppMessage,
  isWhatsAppConfigured,
  openWhatsApp,
} from '@/lib/whatsapp';

interface WhatsAppFloatProps {
  vehicleName?: string;
  serviceName?: string;
  customMessage?: string;
}

/**
 * Floating WhatsApp launcher.
 *
 * Shows a pulsing chat button with a greeting popover. When
 * NEXT_PUBLIC_WHATSAPP_NUMBER is not configured the button renders in a
 * disabled state with a configuration hint instead of a fake chat link.
 */
export function WhatsAppFloat({ vehicleName, serviceName, customMessage }: WhatsAppFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const configured = isWhatsAppConfigured();

  useEffect(() => {
    if (!configured || hasInteracted) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setTimeout(() => setIsOpen(false), 5000);
    }, 10000);
    return () => clearTimeout(timer);
  }, [configured, hasInteracted]);

  const getMessage = () => {
    if (customMessage) return customMessage;
    if (vehicleName) return generateVehicleInquiryWhatsAppMessage(vehicleName);
    if (serviceName) return generateServiceInquiryWhatsAppMessage(serviceName);
    return generateGeneralWhatsAppMessage();
  };

  const handleClick = () => {
    setHasInteracted(true);
    openWhatsApp(getMessage());
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasInteracted(true);
        }}
        disabled={!configured}
        title={configured ? 'Chat on WhatsApp' : WHATSAPP_CONFIG_HINT}
        aria-label={configured ? 'Chat on WhatsApp' : 'WhatsApp is not configured'}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl',
          'flex items-center justify-center transition-all duration-300',
          'focus:outline-none focus:ring-4 focus:ring-green-500/50',
          configured
            ? 'bg-green-600 text-white hover:bg-green-700 animate-pulse-soft'
            : 'bg-gray-400 text-white cursor-not-allowed opacity-70'
        )}
      >
        <MessageCircle className="w-7 h-7" aria-hidden="true" />
        {!configured && <span className="sr-only">WhatsApp Not Configured</span>}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-72 animate-slide-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Awan Rental Service</p>
                  <p className="text-xs text-green-100">Send us a message</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Hello! How can we help you today?
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleClick}
                  disabled={!configured}
                  title={configured ? undefined : WHATSAPP_CONFIG_HINT}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  {configured ? 'Start Chat on WhatsApp' : 'WhatsApp Not Configured'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
