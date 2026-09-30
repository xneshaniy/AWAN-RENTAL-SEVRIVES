'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  Car,
  List,
  Users,
  Mail,
  Settings,
  Search,
  FileText,
  UserCog,
  LogOut,
  Menu,
  X,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavEntry {
  label: string;
  href: string;
}

interface AdminShellProps {
  nav: NavEntry[];
  user: { name?: string | null; email: string; role: string };
  unreadMessages?: number;
  children: React.ReactNode;
}

const ICONS_BY_HREF: Record<string, LucideIcon> = {
  '/admin': LayoutDashboard,
  '/admin/bookings': Calendar,
  '/admin/vehicles': Car,
  '/admin/services': List,
  '/admin/blog': FileText,
  '/admin/customers': Users,
  '/admin/messages': Mail,
  '/admin/settings': Settings,
  '/admin/seo': Search,
  '/admin/users': UserCog,
};

/**
 * Shared chrome for every authenticated admin page: sidebar navigation with
 * active-link highlighting, a mobile drawer, the session chip and a working
 * sign-out button (next-auth signOut handles the CSRF token, unlike a raw
 * form POST to /api/auth/signout).
 */
export function AdminShell({ nav, user, unreadMessages = 0, children }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close the drawer with Escape for keyboard users.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

  // Site Settings, SEO Settings and Admin Users are ADMIN-only; hide them
  // from STAFF accounts (the pages + middleware redirect them anyway).
  const ADMIN_ONLY_HREFS = ['/admin/settings', '/admin/seo', '/admin/users'];
  const visibleNav =
    user.role === 'ADMIN' ? nav : nav.filter((item) => !ADMIN_ONLY_HREFS.includes(item.href));

  const navLinks = (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
      {visibleNav.map((item) => {
        const Icon = ICONS_BY_HREF[item.href] || LayoutDashboard;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={() => setDrawerOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors',
              active
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden={true} />
            <span className="flex-1">{item.label}</span>
            {item.href === '/admin/messages' && unreadMessages > 0 && (
              <span
                className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white"
                aria-label={`${unreadMessages} unread messages`}
              >
                {unreadMessages}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <>
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <Link href="/admin" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
          <Car className="h-8 w-8 text-primary-600" aria-hidden={true} />
          <span className="font-heading text-xl font-bold text-gray-900 dark:text-white">
            Awan Rental Admin
          </span>
        </Link>
      </div>

      {navLinks}

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {user.name?.charAt(0) || user.email.charAt(0) || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {user.name || user.email}
            </p>
            <p className="text-xs capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut className="h-5 w-5" aria-hidden={true} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
        />
      )}

      {/* Sidebar: fixed on large screens, slide-in drawer below lg */}
      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900',
          drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen((open) => !open)}
                aria-expanded={drawerOpen}
                aria-controls="admin-sidebar"
                aria-label={drawerOpen ? 'Close admin menu' : 'Open admin menu'}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
              >
                {drawerOpen ? (
                  <X className="h-5 w-5" aria-hidden={true} />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden={true} />
                )}
              </button>
              <span className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                View Site
                <ExternalLink className="h-3.5 w-3.5" aria-hidden={true} />
              </Link>
              <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {user.role}
              </span>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
