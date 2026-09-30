import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getBusinessInfo } from '@/lib/settings';
import { formatDate } from '@/lib/utils';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { Card, CardContent } from '@/components/ui/Card';
import { BookOpen, Newspaper } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides and travel information about driving, car rental, airport transfers and intercity travel in Pakistan.',
  alternates: { canonical: '/blog' },
  openGraph: {
    url: '/blog',
    type: 'website',
    title: 'Blog',
    description:
      'Guides and travel information about driving, car rental, airport transfers and intercity travel in Pakistan.',
  },
};

/**
 * Public blog index. Only shows published, non-archived posts with a
 * publication date - drafts are never rendered on the public site.
 */
export default async function BlogIndexPage() {
  const [businessInfo, posts] = await Promise.all([
    getBusinessInfo(),
    prisma.blogPost.findMany({
      where: { isPublished: true, archivedAt: null, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        featuredImage: true,
        publishedAt: true,
      },
    }),
  ]);

  return (
    <Layout businessInfo={businessInfo}>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Blog' }]} />

      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary-400">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Blog
            </p>
            <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Guides &amp; Travel Information
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              Practical articles about driving, car rental, airport transfers and getting around
              Pakistan.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <Newspaper
                className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
                aria-hidden="true"
              />
              <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                No posts published yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New guides will appear here once they are published.
              </p>
              <div className="mt-6">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Book a Car
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Card variant="default" padding="none" className="h-full overflow-hidden">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen
                              className="h-10 w-10 text-gray-300 dark:text-gray-600"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </div>
                      <CardContent className="flex flex-1 flex-col p-5">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {post.category}
                          </span>
                          <time
                            dateTime={post.publishedAt?.toISOString()}
                            className="text-xs text-gray-500 dark:text-gray-400"
                          >
                            {formatDate(post.publishedAt!)}
                          </time>
                        </div>
                        <h2 className="font-heading text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white">
                          {post.title}
                        </h2>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                          {post.excerpt}
                        </p>
                        <span className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400">
                          Read article →
                        </span>
                      </CardContent>
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <WhatsAppFloat />
    </Layout>
  );
}
