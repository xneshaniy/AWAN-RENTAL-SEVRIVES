'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, X, ShieldCheck, Users } from 'lucide-react';
import { adminUserSchema } from '@/lib/validations';
import { createAdminUser, updateAdminUser, deleteAdminUser } from '@/actions/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'STAFF';
  phone: string | null;
  city: string | null;
  createdAt: Date | string;
  _count: { bookings: number };
}

// Creating a user requires a password; editing keeps the current one when
// the field is left empty.
const createUserSchema = adminUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof adminUserSchema>;

interface AdminUsersManagerProps {
  initialUsers: AdminUserRow[];
  currentUserEmail: string;
}

export function AdminUsersManager({ initialUsers, currentUserEmail }: AdminUsersManagerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'STAFF', phone: '', city: '' },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'STAFF', phone: '', city: '' },
  });

  const resetForms = () => {
    setMode('list');
    setEditingUser(null);
    createForm.reset({ name: '', email: '', password: '', role: 'STAFF', phone: '', city: '' });
    editForm.reset({ name: '', email: '', password: '', role: 'STAFF', phone: '', city: '' });
  };

  const applyFieldErrors = <T extends FieldValues>(
    form: UseFormReturn<T>,
    fieldErrors: Record<string, string[]> | undefined
  ) => {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (messages?.[0]) {
        form.setError(field as FieldPath<T>, { type: 'server', message: messages[0] });
      }
    });
  };

  const onCreate = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createAdminUser(data);
      if (!result.success) {
        applyFieldErrors(createForm, result.fieldErrors);
        toast.error(result.error || 'Failed to create user');
        return;
      }
      toast.success('Admin user created');
      resetForms();
      router.refresh();
    } catch {
      toast.error('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEdit = async (data: EditUserFormData) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      // An empty password means "keep the current password".
      const payload = { ...data, password: data.password || undefined };
      const result = await updateAdminUser(editingUser.id, payload);
      if (!result.success) {
        applyFieldErrors(editForm, result.fieldErrors);
        toast.error(result.error || 'Failed to update user');
        return;
      }
      toast.success('Admin user updated');
      resetForms();
      router.refresh();
    } catch {
      toast.error('Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (user: AdminUserRow) => {
    if (pendingDeleteId !== user.id) {
      setPendingDeleteId(user.id);
      return;
    }
    try {
      const result = await deleteAdminUser(user.id);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete user');
        return;
      }
      toast.success('Admin user removed');
      setPendingDeleteId(null);
      router.refresh();
    } catch {
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const startEdit = (user: AdminUserRow) => {
    setEditingUser(user);
    setMode('edit');
    editForm.reset({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      city: user.city || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {initialUsers.length} admin {initialUsers.length === 1 ? 'account' : 'accounts'} can access
          this dashboard.
        </p>
        {mode === 'list' && (
          <Button type="button" onClick={() => setMode('create')}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Admin User
          </Button>
        )}
      </div>

      {mode === 'create' && (
        <Card variant="outlined" padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add Admin User</CardTitle>
            <button
              type="button"
              onClick={resetForms}
              aria-label="Cancel create"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4" aria-busy={isSubmitting}>
              <fieldset disabled={isSubmitting} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full Name" {...createForm.register('name')} error={createForm.formState.errors.name?.message} />
                  <Input label="Email Address" type="email" {...createForm.register('email')} error={createForm.formState.errors.email?.message} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...createForm.register('password')}
                    error={createForm.formState.errors.password?.message}
                  />
                  <div className="space-y-1.5">
                    <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      id="create-role"
                      {...createForm.register('role')}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="STAFF">Staff - back-office access</option>
                      <option value="ADMIN">Admin - full access</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Create User'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForms}>
                    Cancel
                  </Button>
                </div>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      )}

      {mode === 'edit' && editingUser && (
        <Card variant="outlined" padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit {editingUser.email}</CardTitle>
            <button
              type="button"
              onClick={resetForms}
              aria-label="Cancel edit"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4" aria-busy={isSubmitting}>
              <fieldset disabled={isSubmitting} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full Name" {...editForm.register('name')} error={editForm.formState.errors.name?.message} />
                  <Input label="Email Address" type="email" {...editForm.register('email')} error={editForm.formState.errors.email?.message} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current password"
                    {...editForm.register('password')}
                    error={editForm.formState.errors.password?.message}
                  />
                  <div className="space-y-1.5">
                    <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      id="edit-role"
                      {...editForm.register('role')}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="STAFF">Staff - back-office access</option>
                      <option value="ADMIN">Admin - full access</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForms}>
                    Cancel
                  </Button>
                </div>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      )}

      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" aria-hidden="true" />
            Admin &amp; Staff Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialUsers.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p>No admin accounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {initialUsers.map((user) => {
                    const isSelf = user.email === currentUserEmail;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || '—'}
                        </td>
                        <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                        <td className="py-3">
                          <Badge variant={user.role === 'ADMIN' ? 'info' : 'default'}>{user.role}</Badge>
                        </td>
                        <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              Edit
                            </button>
                            {isSelf ? (
                              <span className="text-xs text-gray-400" title="You cannot remove your own account">
                                Signed in
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onDelete(user)}
                                onBlur={() => setPendingDeleteId((id) => (id === user.id ? null : id))}
                                className={
                                  pendingDeleteId === user.id
                                    ? 'inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-sm font-medium text-white'
                                    : 'inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400'
                                }
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                {pendingDeleteId === user.id ? 'Confirm remove?' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
