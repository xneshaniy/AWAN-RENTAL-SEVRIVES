'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { faqSchema } from '@/lib/validations';
import { createFAQ, updateFAQ, deleteFAQ } from '@/actions/settings';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, X, Power, HelpCircle } from 'lucide-react';

type FaqFormValues = z.infer<typeof faqSchema>;

/** One FAQ row as the list and editor see it. */
export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

interface FaqManagerProps {
  initialFaqs: FaqRecord[];
}

/**
 * CRUD screen for the FAQ records that power /faq and the FAQ block on
 * /self-drive. Server-side persistence runs through the existing
 * createFAQ / updateFAQ / deleteFAQ actions (staff-guarded + Zod-validated);
 * this component only owns form state and optimistic messaging.
 */
export function FaqManager({ initialFaqs }: FaqManagerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: '', answer: '', category: 'Booking', order: 0, isActive: true },
  });

  const blankValues: FaqFormValues = {
    question: '',
    answer: '',
    category: 'Booking',
    order: 0,
    isActive: true,
  };

  const closeForm = () => {
    setMode('list');
    setEditingId(null);
    reset(blankValues);
  };

  const startEdit = (faq: FaqRecord) => {
    setEditingId(faq.id);
    setMode('edit');
    reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive,
    });
  };

  const applyFieldErrors = (fieldErrors: Record<string, string[]> | undefined) => {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      const message = messages?.[0];
      if (!message) return;
      try {
        setError(field as FieldPath<FaqFormValues>, { type: 'server', message });
      } catch {
        toast.error(message);
      }
    });
  };

  const onSubmit = async (data: FaqFormValues) => {
    setIsSubmitting(true);
    try {
      const result = mode === 'create' ? await createFAQ(data) : await updateFAQ(editingId!, data);

      if (!result.success) {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error || 'Failed to save the FAQ');
        return;
      }

      toast.success(mode === 'create' ? 'FAQ created' : 'FAQ updated');
      closeForm();
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (faq: FaqRecord) => {
    try {
      const result = await updateFAQ(faq.id, { isActive: !faq.isActive });
      if (!result.success) {
        toast.error(result.error || 'Failed to update the FAQ');
        return;
      }
      toast.success(faq.isActive ? 'FAQ hidden from the site' : 'FAQ published');
      router.refresh();
    } catch {
      toast.error('Failed to update the FAQ. Please try again.');
    }
  };

  const onDelete = async (faq: FaqRecord) => {
    // Two-step confirm, matching every other destructive action in the admin.
    if (pendingDelete !== faq.id) {
      setPendingDelete(faq.id);
      return;
    }
    setPendingDelete(null);
    try {
      const result = await deleteFAQ(faq.id);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete the FAQ');
        return;
      }
      toast.success('FAQ deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete the FAQ. Please try again.');
    }
  };

  // Existing categories first (so edits do not silently invent a new one),
  // then a free-text field for genuinely new categories.
  const knownCategories = Array.from(new Set(initialFaqs.map((f) => f.category))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {initialFaqs.length} question{initialFaqs.length === 1 ? '' : 's'} in the database.
          These feed the public FAQ page and the FAQ block on the Self Drive page -
          edits go live immediately.
        </p>
        {mode === 'list' && (
          <Button type="button" onClick={() => setMode('create')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Question
          </Button>
        )}
      </div>

      {(mode === 'create' || mode === 'edit') && (
        <Card variant="outlined" padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{mode === 'create' ? 'Add Question' : 'Edit Question'}</CardTitle>
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
                <Textarea
                  label="Question"
                  rows={2}
                  {...register('question')}
                  error={errors.question?.message}
                  required
                />
                <Textarea
                  label="Answer"
                  rows={5}
                  {...register('answer')}
                  error={errors.answer?.message}
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Category"
                    list="faq-categories"
                    {...register('category')}
                    helperText={
                      knownCategories.length > 0
                        ? `Existing: ${knownCategories.join(', ')}`
                        : 'Groups related questions together'
                    }
                    error={errors.category?.message}
                    required
                  />
                  <datalist id="faq-categories">
                    {knownCategories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
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
                        {...register('isActive')}
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      Visible on public site
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Question' : 'Save Changes'}
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
          {initialFaqs.length === 0 ? (
            <div className="py-14 text-center">
              <HelpCircle className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">No questions yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add the first question to populate the public FAQ page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Question</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="w-44 pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {initialFaqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{faq.order}</td>
                      <td className="py-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {faq.question}
                        </span>
                        <p className="mt-0.5 max-w-xl truncate text-xs text-gray-500 dark:text-gray-400">
                          {faq.answer}
                        </p>
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{faq.category}</td>
                      <td className="py-3">
                        <Badge variant={faq.isActive ? 'success' : 'outline'}>
                          {faq.isActive ? 'Visible' : 'Hidden'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(faq)}
                            title="Edit question"
                            aria-label={`Edit ${faq.question}`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(faq)}
                            title={faq.isActive ? 'Hide from site' : 'Show on site'}
                            aria-label={`${faq.isActive ? 'Hide' : 'Show'} ${faq.question}`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-amber-600 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <Power className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(faq)}
                            onBlur={() => setPendingDelete((value) => (value === faq.id ? null : value))}
                            title={pendingDelete === faq.id ? 'Confirm delete' : 'Delete question'}
                            aria-label={
                              pendingDelete === faq.id
                                ? `Confirm delete ${faq.question}`
                                : `Delete ${faq.question}`
                            }
                            className={
                              pendingDelete === faq.id
                                ? 'rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white'
                                : 'rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30'
                            }
                          >
                            {pendingDelete === faq.id ? 'Confirm?' : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
