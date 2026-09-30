import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminUsers } from '@/actions/user';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';

export const metadata: Metadata = {
  title: 'Admin Users',
  robots: { index: false, follow: false },
};

/**
 * Admin user management. Restricted to full ADMIN accounts - STAFF accounts
 * that wander here are sent to the unauthorized page.
 */
export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');
  if (session.user.role !== 'ADMIN') redirect('/admin/unauthorized');

  const users = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
          Admin Users
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage which accounts can access the admin dashboard. Passwords are stored only as
          bcrypt hashes and are never shown anywhere.
        </p>
      </div>

      <AdminUsersManager
        initialUsers={users.map((user) => ({
          ...user,
          // The action already filters to admin/staff roles only.
          role: user.role as 'ADMIN' | 'STAFF',
          createdAt: user.createdAt.toISOString(),
        }))}
        currentUserEmail={session.user.email ?? ''}
      />
    </div>
  );
}
