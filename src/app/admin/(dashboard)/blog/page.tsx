import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BlogRowActions } from '@/components/admin/BlogRowActions';
import { Search, FileText, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  robots: { index: false, follow: false },
};

interface BlogListPageProps {
  searchParams: { q?: string; status?: string; page?: string };
}

const STATUS_FILTERS = [
  { value: undefined, label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
] as const;

/**
 * Admin list of blog posts (drafts, published and archived) with search and
 * status filters as plain GET parameters. Staff-guarded by the dashboard
 * layout; mutations run through BlogRowActions server actions.
 */
export default async function AdminBlogPage({ searchParams }: BlogListPageProps) {
  const query = searchParams.q?.trim();
  const status = ['published', 'draft', 'archived'].includes(searchParams.status ?? '')
    ? searchParams.status
    : undefined;
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (status === 'published') {
    where.isPublished = true;
    where.archivedAt = null;
  } else if (status === 'draft') {
    where.isPublished = false;
    where.archivedAt = null;
  } else if (status === 'archived') {
    where.archivedAt = { not: null };
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [posts, total, publishedCount, draftCount, archivedCount] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (currentPage - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        isPublished: true,
        archivedAt: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.count({ where: { isPublished: true, archivedAt: null } }),
    prisma.blogPost.count({ where: { isPublished: false, archivedAt: null } }),
    prisma.blogPost.count({ where: { archivedAt: { not: null } } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = Boolean(query || status);

  const linkWith = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const q = 'q' in overrides ? overrides.q : query;
    const st = 'status' in overrides ? overrides.status : status;
    const pg = 'page' in overrides ? overrides.page : undefined;
    if (q) params.set('q', q);
    if (st) params.set('status', st);
    if (pg) params.set('page', pg);
    const qs = params.toString();
    return qs ? `/admin/blog?${qs}` : '/admin/blog';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Blog</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {publishedCount} published · {draftCount} drafts · {archivedCount} archived. Posts are
            only visible on /blog when published.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/admin/blog" method="get" className="flex flex-1 items-center gap-3">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={query ?? ''}
              placeholder="Search title, slug, category..."
              aria-label="Search blog posts"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            Search
          </button>
        </form>

        <nav className="flex flex-wrap gap-2" aria-label="Post filters">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.label}
              href={linkWith({ status: filter.value, page: undefined })}
              aria-current={status === filter.value ? 'page' : undefined}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                status === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
      </div>

      <Card variant="default" padding="md">
        <CardContent>
          {posts.length === 0 ? (
            <div className="py-14 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                {hasFilters ? 'No posts match your filters.' : 'No posts yet.'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasFilters
                  ? 'Try clearing the filters.'
                  : 'Create your first post — it stays a private draft until you publish it.'}
              </p>
              {hasFilters && (
                <div className="mt-4">
                  <Link
                    href="/admin/blog"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Clear filters
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {posts.map((post) => {
                  const isArchived = Boolean(post.archivedAt);
                  return (
                    <li
                      key={post.id}
                      className="flex flex-col gap-3 px-2 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="truncate text-sm font-semibold text-gray-900 hover:text-primary-600 dark:text-white"
                          >
                            {post.title}
                          </Link>
                          <Badge
                            variant={
                              isArchived ? 'outline' : post.isPublished ? 'success' : 'warning'
                            }
                          >
                            {isArchived ? 'Archived' : post.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          /blog/{post.slug} · {post.category} ·{' '}
                          {post.isPublished && post.publishedAt
                            ? `Published ${formatDate(post.publishedAt)}`
                            : `Updated ${formatDate(post.updatedAt)}`}
                        </p>
                      </div>
                      <div className="lg:flex-shrink-0">
                        <BlogRowActions
                          postId={post.id}
                          isPublished={post.isPublished}
                          isArchived={isArchived}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-3"
                  aria-label="Blog pagination"
                >
                  <Link
                    href={linkWith({ page: String(currentPage - 1) })}
                    className={cn(
                      'rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                      currentPage === 1 && 'pointer-events-none opacity-40'
                    )}
                  >
                    Previous
                  </Link>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages} ({total} total)
                  </span>
                  <Link
                    href={linkWith({ page: String(currentPage + 1) })}
                    className={cn(
                      'rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                      currentPage === totalPages && 'pointer-events-none opacity-40'
                    )}
                  >
                    Next
                  </Link>
                </nav>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
