'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <ServiceWorkerRegister />
      </ThemeProvider>
    </SessionProvider>
  );
}