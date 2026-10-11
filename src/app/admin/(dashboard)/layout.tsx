import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminShell, ADMIN_NAV } from '@/components/admin/AdminShell';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Awan Rental Admin',
  },
  description: 'Admin dashboard for Awan Rental Service - manage bookings, vehicles, customers, and settings.',
  robots: 'noindex, nofollow',
  manifest: '/admin-manifest.webmanifest',
  themeColor: '#15803d',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ARS Admin',
  },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Unauthenticated visitors go to the login page; authenticated users
  // without an admin role get the explicit unauthorized page.
  if (!session?.user) {
    redirect('/admin/login');
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    redirect('/admin/unauthorized');
  }

  const unreadMessages = await prisma.contactMessage.count({
    where: { isRead: false, status: { not: 'ARCHIVED' } },
  });

  return (
    <AdminShell
      nav={ADMIN_NAV}
      unreadMessages={unreadMessages}
      user={{
        name: session.user.name,
        email: session.user.email ?? '',
        role: session.user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
