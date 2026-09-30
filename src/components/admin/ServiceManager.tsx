'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { serviceSchema } from '@/lib/validations';
import { SERVICE_ICON_KEYS } from '@/lib/services';
import { createService, updateService, deleteService } from '@/actions/settings';
import type { ServiceDTO } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, X, Power, ListChecks } from 'lucide-react';
import { getServiceIcon } from '@/lib/services';

// The shared serviceSchema already accepts an empty image (normalised to
// null), site paths such as /services/hero.jpg and full https:// URLs.
const serviceFormSchema = serviceSchema;
type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface FeatureRow {
  title: string;
  description: string;
}

const ICON_OPTIONS = SERVICE_ICON_KEYS.map((key) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

interface ServiceManagerProps {
  initialServices: ServiceDTO[];
}

export function ServiceManager({ initialServices }: ServiceManagerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      active: true,
      icon: 'car',
      href: '/',
      order: 0,
    },
  });

  const blankValues: ServiceFormValues = {
    name: '',
    slug: '',
    description: '',
    image: '',
    active: true,
    icon: 'car',
    href: '/',
    order: 0,
    features: [],
  };

  const closeForm = () => {
    setMode('list');
    setEditingSlug(null);
    setFeatures([]);
    reset(blankValues);
  };

  const startEdit = (service: ServiceDTO) => {
    setEditingSlug(service.slug);
    setMode('edit');
    setFeatures(service.features.map((feature) => ({ ...feature })));
    reset({
      name: service.name,
      slug: service.slug,
      description: service.description,
      image: service.image ?? '',
      active: service.active,
      icon: service.icon || 'car',
      href: service.href || `/${service.slug}`,
      order: service.order,
      features: service.features,
    });
  };

  const applyFieldErrors = (fieldErrors: Record<string, string[]> | undefined) => {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      const message = messages?.[0];
      if (!message) return;
      try {
        setError(field as FieldPath<ServiceFormValues>, { type: 'server', message });
      } catch {
        toast.error(message);
      }
    });
  };

  const onSubmit = async (data: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        image: data.image?.trim() ? data.image.trim() : undefined,
        features: features
          .filter((feature) => feature.title.trim() && feature.description.trim())
          .map((feature) => ({ title: feature.title.trim(), description: feature.description.trim() })),
      };

      const result =
        mode === 'create' ? await createService(payload) : await updateService(editingSlug!, payload);

      if (!result.success) {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error || 'Failed to save service');
        return;
      }

      toast.success(mode === 'create' ? 'Service created' : 'Service updated');
      closeForm();
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (service: ServiceDTO) => {
    try {
      const result = await updateService(service.slug, { active: !service.active });
      if (!result.success) {
        toast.error(result.error || 'Failed to update service');
        return;
      }
      toast.success(service.active ? `${service.name} deactivated` : `${service.name} activated`);
      router.refresh();
    } catch {
      toast.error('Failed to update service. Please try again.');
    }
  };

  const onDelete = async (service: ServiceDTO) => {
    if (pendingDelete !== service.slug) {
      setPendingDelete(service.slug);
      return;
    }
    setPendingDelete(null);
    try {
      const result = await deleteService(service.slug);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete service');
        return;
      }
      toast.success(`${service.name} deleted`);
      router.refresh();
    } catch {
      toast.error('Failed to delete service. Please try again.');
    }
  };

  const updateFeature = (index: number, patch: Partial<FeatureRow>) => {
    setFeatures((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {initialServices.length} service{initialServices.length === 1 ? '' : 's'} in the database.
          Public service pages read from these records - edits go live immediately.
        </p>
        {mode === 'list' && (
          <Button type="button" onClick={() => setMode('create')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Service
          </Button>
        )}
      </div>

      {(mode === 'create' || mode === 'edit') && (
        <Card variant="outlined" padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{mode === 'create' ? 'Add Service' : 'Edit Service'}</CardTitle>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Cancel"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting}>
              <fieldset disabled={isSubmitting} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Service Name"
                    {...register('name')}
                    error={errors.name?.message}
                    required
                  />
                  <Input
                    label="Slug"
                    {...register('slug')}
                    placeholder="e.g. intercity-travel"
                    helperText="Lowercase letters, numbers and hyphens. Used in the public URL."
                    error={errors.slug?.message}
                    required
                  />
                </div>
                <Textarea
                  label="Description"
                  rows={4}
                  {...register('description')}
                  error={errors.description?.message}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Image URL"
                    {...register('image')}
                    placeholder="/services/hero.jpg"
                    helperText="Optional"
                    error={errors.image?.message}
                  />
                  <Select
                    label="Icon"
                    options={ICON_OPTIONS}
                    {...register('icon')}
                    error={errors.icon?.message}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Link"
                    {...register('href')}
                    helperText="Where the card links to"
                    error={errors.href?.message}
                  />
                  <Input
                    label="Order"
                    type="number"
                    min={0}
                    {...register('order')}
                    helperText="Lower numbers appear first"
                    error={errors.order?.message}
                  />
                  <div className="flex items-end pb-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        {...register('active')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Active (visible on public site)
                    </label>
                  </div>
                </div>

                {/* Features */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <ListChecks className="h-4 w-4" aria-hidden="true" />
                      Features ({features.length}/12)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFeatures((current) =>
                          current.length >= 12
                            ? current
                            : [...current, { title: '', description: '' }]
                        )
                      }
                      disabled={features.length >= 12}
                    >
                      <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Add Feature
                    </Button>
                  </div>
                  {features.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No features yet. Each feature needs a title and a short description.
                    </p>
                  )}
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={feature.title}
                          onChange={(event) => updateFeature(index, { title: event.target.value })}
                          placeholder="Feature title"
                          aria-label={`Feature ${index + 1} title`}
                        />
                        <Input
                          value={feature.description}
                          onChange={(event) =>
                            updateFeature(index, { description: event.target.value })
                          }
                          placeholder="Feature description"
                          aria-label={`Feature ${index + 1} description`}
                          fullWidth
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFeatures((current) => current.filter((_, i) => i !== index))
                          }
                          aria-label={`Remove feature ${index + 1}`}
                          className="rounded-lg p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Service' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                </div>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      )}

      <Card variant="default" padding="md">
        <CardContent>
          {initialServices.length === 0 ? (
            <div className="py-14 text-center">
              <ListChecks className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">No services yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create the first service record to power the public service pages.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Service</th>
                    <th className="pb-3 font-medium">Slug</th>
                    <th className="pb-3 font-medium">Link</th>
                    <th className="pb-3 font-medium">Features</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="w-44 pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {initialServices.map((service) => {
                    const Icon = getServiceIcon(service.icon);
                    return (
                      <tr key={service.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                          {service.order}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </span>
                          </div>
                          <p className="mt-0.5 max-w-md truncate text-xs text-gray-500 dark:text-gray-400">
                            {service.description}
                          </p>
                        </td>
                        <td className="py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                          {service.slug}
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                          {service.href}
                        </td>
                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                          {service.features.length}
                        </td>
                        <td className="py-3">
                          <Badge variant={service.active ? 'success' : 'outline'}>
                            {service.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(service)}
                              title="Edit service"
                              aria-label={`Edit ${service.name}`}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(service)}
                              title={service.active ? 'Deactivate' : 'Activate'}
                              aria-label={`${service.active ? 'Deactivate' : 'Activate'} ${service.name}`}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-amber-600 dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                              <Power className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(service)}
                              onBlur={() => setPendingDelete((value) => (value === service.slug ? null : value))}
                              title={pendingDelete === service.slug ? 'Confirm delete' : 'Delete service'}
                              aria-label={
                                pendingDelete === service.slug
                                  ? `Confirm delete ${service.name}`
                                  : `Delete ${service.name}`
                              }
                              className={
                                pendingDelete === service.slug
                                  ? 'rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white'
                                  : 'rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30'
                              }
                            >
                              {pendingDelete === service.slug ? (
                                'Confirm?'
                              ) : (
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
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
