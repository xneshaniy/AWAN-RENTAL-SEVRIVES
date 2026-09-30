'use client';
import { signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <User className="h-5 w-5" />
          Admin User
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-2 rounded-md p-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
