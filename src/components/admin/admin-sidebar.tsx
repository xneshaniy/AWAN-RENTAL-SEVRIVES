'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, CalendarDays, MessageSquare, Settings } from 'lucide-react';

const routes = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/admin/vehicles', icon: Car },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">Awan Rental</h1>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {routes.map((route) => {
          const isActive = pathname === route.href || (route.href !== '/admin' && pathname?.startsWith(route.href));
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {route.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
