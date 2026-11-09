import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackToTop } from '@/components/common/BackToTop';
import { MobileBookBar } from '@/components/common/MobileBookBar';
import { InstallAppBanner } from '@/components/common/InstallAppBanner';

interface LayoutProps {
  children: ReactNode;
  businessInfo?: Awaited<ReturnType<typeof import('@/lib/settings').getBusinessInfo>>;
}

export function Layout({ children, businessInfo }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header businessInfo={businessInfo} />
      <main className="flex-1 pt-16 lg:pt-20" id="main-content">
        {children}
      </main>
      <Footer businessInfo={businessInfo} />
      {/* Bottom-left, so it never fights the WhatsApp launcher (bottom-right)
          or the mobile booking bar. Both are fixed overlays: they live outside
          <main> and the footer carries matching bottom padding on mobile. */}
      <BackToTop />
      <MobileBookBar />
      <InstallAppBanner />
    </div>
  );
}