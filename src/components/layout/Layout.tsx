import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  businessInfo?: Awaited<ReturnType<typeof import('@/lib/settings').getBusinessInfo>>;
}

export function Layout({ children, businessInfo }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-50">
      <Header businessInfo={businessInfo} />
      <main className="flex-1 pt-16 lg:pt-20" id="main-content">
        {children}
      </main>
      <Footer businessInfo={businessInfo} />
    </div>
  );
}