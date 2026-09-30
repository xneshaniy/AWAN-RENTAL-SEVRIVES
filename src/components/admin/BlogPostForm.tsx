'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { blogPostSchema } from '@/lib/validations';
import { createBlogPost, updateBlogPost } from '@/actions/blog';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Save } from 'lucide-react';

/** The form edits tags as a comma-separated string; the action validates the array. */
const blogFormSchema = blogPostSchema.omit({ tags: true }).extend({
  tags: z.string(),
});
type BlogFormValues = z.infer<typeof blogFormSchema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/** Plain, serializable subset of a BlogPost used to prefill the edit form. */
export interface BlogPostInitial {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
}

interface BlogPostFormProps {
  mode: 'create' | 'edit';
  postId?: string;
  initial?: BlogPostInitial;
}

const DEFAULT_VALUES: BlogFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  category: 'Guides',
  tags: '',
  seoTitle: '',
  seoDescription: '',
  isPublished: false,
};

/**
 * Create/edit form for a blog post. New posts default to draft; the
 * "Published" checkbox is the only thing that makes a post public. The slug
 * auto-fills from the title until the editor types their own.
 */
export function BlogPostForm({ mode, postId, initial }: BlogPostFormProps) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: initial ? { ...initial, tags: initial.tags.join(', ') } : DEFAULT_VALUES,
  });

  const title = watch('title');
  const seoTitle = watch('seoTitle') ?? '';
  const seoDescription = watch('seoDescription') ?? '';

  // Keep the slug in sync with the title until the editor edits it directly.
  useEffect(() => {
    if (!slugTouched) {
      setValue('slug', slugify(title || ''), { shouldValidate: false });
    }
  }, [title, slugTouched, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    const slug = data.slug || slugify(data.title);
    if (!slug) {
      toast.error('Could not build a slug from the title.');
      return;
    }

    const payload = {
      ...data,
      slug,
      tags: data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const result =
      mode === 'create' ? await createBlogPost(payload) : await updateBlogPost(postId!, payload);

    if (!result.success) {
      toast.error(result.error || 'Failed to save the post.');
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages.length > 0 && field in data) {
            setError(field as FieldPath<BlogFormValues>, { message: messages[0] });
          }
        }
      }
      return;
    }

    toast.success(mode === 'create' ? 'Post created' : 'Post updated');
    router.push('/admin/blog');
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'New Post' : 'Edit Post'}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Posts stay private drafts until they are explicitly published.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/blog">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Back to Blog
          </Link>
        </Button>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="blog-title"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Title
              </label>
              <Input
                id="blog-title"
                placeholder="e.g. Guide to Renting a Car in Pakistan"
                {...register('title')}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="blog-slug"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Slug
              </label>
              <Input
                id="blog-slug"
                placeholder="generated-from-title"
                {...register('slug')}
                onChange={(event) => {
                  setSlugTouched(true);
                  register('slug').onChange(event);
                }}
                aria-invalid={Boolean(errors.slug)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URL: /blog/{watch('slug') || 'your-slug'}
              </p>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="blog-excerpt"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Excerpt
              </label>
              <Textarea
                id="blog-excerpt"
                rows={2}
                placeholder="Short summary shown in the blog list and in search results."
                {...register('excerpt')}
                aria-invalid={Boolean(errors.excerpt)}
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.excerpt.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="blog-content"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Content
              </label>
              <Textarea
                id="blog-content"
                rows={16}
                placeholder="Write the post. Separate paragraphs with a blank line."
                {...register('content')}
                aria-invalid={Boolean(errors.content)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Separate paragraphs with a blank line. Plain text only - links and formatting are
                not rendered.
              </p>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="blog-image"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Featured image path or URL
                </label>
                <Input
                  id="blog-image"
                  placeholder="/hero.jpg or https://..."
                  {...register('featuredImage')}
                  aria-invalid={Boolean(errors.featuredImage)}
                />
                {errors.featuredImage && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.featuredImage.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="blog-category"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category
                </label>
                <Input
                  id="blog-category"
                  placeholder="Guides"
                  {...register('category')}
                  aria-invalid={Boolean(errors.category)}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="blog-tags"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tags
              </label>
              <Input id="blog-tags" placeholder="islamabad, airport transfer" {...register('tags')} />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Comma-separated, up to 10 tags.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="blog-seo-title"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                SEO title {seoTitle.length > 0 && <span className="text-gray-400">({seoTitle.length}/70)</span>}
              </label>
              <Input
                id="blog-seo-title"
                placeholder="Leave blank to use the post title"
                {...register('seoTitle')}
                aria-invalid={Boolean(errors.seoTitle)}
              />
              {errors.seoTitle && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.seoTitle.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="blog-seo-description"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                SEO description{' '}
                {seoDescription.length > 0 && (
                  <span className="text-gray-400">({seoDescription.length}/170)</span>
                )}
              </label>
              <Textarea
                id="blog-seo-description"
                rows={2}
                placeholder="Leave blank to use the excerpt"
                {...register('seoDescription')}
                aria-invalid={Boolean(errors.seoDescription)}
              />
              {errors.seoDescription && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.seoDescription.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md">
          <CardContent>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                id="blog-published"
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('isPublished')}
              />
              <span>
                <span className="block font-medium text-gray-800 dark:text-gray-200">Published</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Visible on the public blog at /blog. Uncheck to keep the post as a private draft.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {!isSubmitting && <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/admin/blog">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
