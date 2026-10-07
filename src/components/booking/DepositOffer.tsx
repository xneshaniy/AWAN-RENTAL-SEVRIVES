'use client';

import { useState } from 'react';
import { CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { startSafePayDeposit } from '@/actions/deposit';
import { formatCurrency } from '@/lib/utils';

interface DepositOfferProps {
  bookingNumber: string;
  /** Short-lived HMAC minted by the receipt page; required by the action. */
  token: string;
  /** Deposit due, in paisa. */
  depositPaisa: number;
  /** Human description of how the figure was calculated. */
  rule: string;
}

/**
 * "Pay the deposit" card on the booking receipt page.
 *
 * Card details are never entered here - the action returns a hosted SafePay
 * checkout URL and the browser is redirected to it, so payment data stays on
 * SafePay's own pages (PCI SAQ A). If the action fails, the receipt itself is
 * unaffected: the customer simply keeps their booking request as-is and can
 * pay the balance offline as before.
 */
export function DepositOffer({ bookingNumber, token, depositPaisa, rule }: DepositOfferProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = formatCurrency(depositPaisa / 100);

  const handlePay = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await startSafePayDeposit(bookingNumber, token);
      if (result.success && result.checkoutUrl) {
        // Full navigation: SafePay takes over the page.
        window.location.assign(result.checkoutUrl);
        return;
      }
      setError(result.error ?? 'We could not start the payment just now. Please try again.');
    } catch {
      setError('We could not start the payment just now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50 p-4 text-left dark:border-primary-900/60 dark:bg-primary-950/40">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/60">
          <ShieldCheck className="h-5 w-5 text-primary-700 dark:text-primary-300" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-semibold text-gray-900 dark:text-white">
            Secure this booking with a deposit
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Deposit due now:{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{amount}</span>
            <span className="text-gray-500 dark:text-gray-400"> ({rule})</span>. The balance is
            paid when you collect the vehicle.
          </p>

          <Button
            type="button"
            size="lg"
            fullWidth
            className="mt-4 sm:w-auto"
            onClick={handlePay}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Opening secure checkout…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                Pay {amount} deposit
              </>
            )}
          </Button>

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>
              You are taken to SafePay&apos;s hosted checkout to enter card details. This website
              never sees or stores your card. Paying the deposit does not by itself confirm the
              rental - we still verify availability and contact you.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
