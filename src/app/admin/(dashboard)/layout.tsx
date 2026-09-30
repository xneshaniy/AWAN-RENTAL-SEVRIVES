import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_NAV } from '@/types';
import { AdminShell } from '@/components/admin/AdminShell';

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
