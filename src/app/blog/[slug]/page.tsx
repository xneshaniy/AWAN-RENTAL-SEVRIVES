import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getBusinessInfo } from '@/lib/settings';
import { formatDate } from '@/lib/utils';
import { SITE_NAME, SITE_URL } from '@/config/site';
import { Layout } from '@/components/layout/Layout';
import { WhatsAppFloat } from '@/components/common/WhatsAppFloat';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react';

interface BlogPostPageProps {
  params: { slug: string };
}

/**
 * Fetch one post by slug. Wrapped in React `cache` so `generateMetadata`
 * and the page component share a single database query per request.
 * Only published, non-archived posts are ever returned.
 */
const getPublishedPost = cache(async (slug: string) => {
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.isPublished || post.archivedAt) return null;
  return post;
});

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  if (!post) {
    return { title: 'Post Not Found' };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `/blog/${post.slug}`,
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      ...(post.featuredImage ? { images: [{ url: post.featuredImage }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, businessInfo] = await Promise.all([
    getPublishedPost(params.slug),
    getBusinessInfo(),
  ]);

  if (!post) notFound();

  // Content is stored and rendered as plain text: split on blank lines into
  // paragraphs, never injected as HTML.
  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const publishedAt = post.publishedAt ?? post.createdAt;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    ...(post.featuredImage
      ? {
          image: post.featuredImage.startsWith('http')
            ? post.featuredImage
            : `${SITE_URL}${post.featuredImage}`,
        }
      : {}),
  };

  return (
    <Layout businessInfo={businessInfo}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.title },
        ]}
      />

      <article className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-primary-600">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="hover:text-primary-600">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="truncate text-gray-700 dark:text-gray-300" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

          <header>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={publishedAt.toISOString()}>{formatDate(publishedAt)}</time>
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              {post.excerpt}
            </p>
          </header>

          {post.featuredImage && (
            <div className="relative aspect-video mt-8 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-10 space-y-6">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="leading-relaxed text-gray-700 dark:text-gray-300"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <footer className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Blog
              </Link>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                Book a Car
              </Link>
            </div>
          </footer>
        </div>
      </article>

      <WhatsAppFloat />
    </Layout>
  );
}
