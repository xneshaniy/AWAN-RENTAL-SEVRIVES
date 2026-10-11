'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  Car,
  Images,
  List,
  Users,
  Mail,
  Settings,
  Search,
  FileText,
  HelpCircle,
  UserCog,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationProvider } from '@/components/admin/NotificationProvider';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { Breadcrumb } from '@/components/admin/Breadcrumb';
import { InstallPrompt } from '@/components/admin/InstallPrompt';

interface NavEntry {
  label: string;
  href: string;
  icon?: LucideIcon;
  children?: NavEntry[];
  adminOnly?: boolean;
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
  '/admin/gallery': Images,
  '/admin/services': List,
  '/admin/blog': FileText,
  '/admin/faq': HelpCircle,
  '/admin/customers': Users,
  '/admin/messages': Mail,
  '/admin/settings': Settings,
  '/admin/seo': Search,
  '/admin/users': UserCog,
};

const ADMIN_NAV: NavEntry[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { label: 'Vehicles', href: '/admin/vehicles', icon: Car },
  { label: 'Gallery', href: '/admin/gallery', icon: Images },
  { label: 'Services', href: '/admin/services', icon: List },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Settings', href: '/admin/settings', icon: Settings, adminOnly: true },
  { label: 'SEO', href: '/admin/seo', icon: Search, adminOnly: true },
  { label: 'Admin Users', href: '/admin/users', icon: UserCog, adminOnly: true },
];

/**
 * Admin Shell - shared chrome for every authenticated admin page
 */
export function AdminShell({ nav, user, unreadMessages = 0, children }: AdminShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawers with Escape
  useEffect(() => {
    if (!drawerOpen && !userMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, userMenuOpen]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

  const visibleNav = user.role === 'ADMIN'
    ? nav
    : nav.filter((item) => !item.adminOnly);

  const navLinks = (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
      {visibleNav.map((item) => {
        const Icon = item.icon || ICONS_BY_HREF[item.href] || LayoutDashboard;
        const active = isActive(item.href);
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={item.href} className="relative">
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-expanded={hasChildren ? false : undefined}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200',
                active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden={true} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === '/admin/messages' && unreadMessages > 0 && (
                <span
                  className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-semibold text-white"
                  aria-label={`${unreadMessages} unread messages`}
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
              {hasChildren && (
                <ChevronRight className={cn('h-4 w-4 transition-transform', active && 'rotate-90')} aria-hidden={true} />
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <>
      <div className="border-b border-gray-200 p-5 dark:border-gray-800">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setDrawerOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600">
            <Car className="h-6 w-6 text-white" aria-hidden={true} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading text-xl font-bold text-gray-900 dark:text-white truncate block">
              Awan Rental Admin
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
              {user.role} Panel
            </span>
          </div>
        </Link>
      </div>

      {navLinks}

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-3 text-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {user.name?.charAt(0) || user.email.charAt(0) || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
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
    <NotificationProvider>
      <div className="min-h-screen bg-cream-100 dark:bg-gray-900">
        {/* Mobile drawer backdrop */}
        {drawerOpen && (
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden transition-opacity"
          />
        )}

        {/* Sidebar */}
        <aside
          id="admin-sidebar"
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950',
            drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {sidebarContent}
        </aside>

        <div className="flex min-h-screen flex-col lg:ml-72">
          {/* Mobile drawer backdrop */}
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
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
                <Breadcrumb />
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                >
                  <span>View Site</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <span className="hidden sm:inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {user.role}
                </span>
                <NotificationBell />
                <InstallPrompt compact />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {user.name?.charAt(0) || user.email.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} aria-hidden={true} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden="true"
                      />
                      <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900 animate-in fade-in-0 zoom-in-95 duration-150">
                        <Link
                          href="/admin/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <Settings className="h-4 w-4" aria-hidden={true} />
                          Settings
                        </Link>
                        <hr className="my-1 border-gray-200 dark:border-gray-800" />
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: '/admin/login' })}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-800"
                        >
                          <LogOut className="h-4 w-4" aria-hidden={true} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}

export { ADMIN_NAV };