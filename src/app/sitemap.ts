import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/config/site';

// Served per-request so publishing or archiving a post is reflected in the
// sitemap immediately (a build-time snapshot never sees later publishes).
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticPages = [
    '',
    '/vehicles',
    '/services',
    '/self-drive',
    '/chauffeur-service',
    '/airport-transfers',
    '/corporate-travel',
    '/intercity-travel',
    '/family-travel',
    '/event-transportation',
    '/commercial-vehicle-rental',
    '/about',
    '/contact',
    '/booking',
    '/blog',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  const vehicles = await prisma.vehicle.findMany({
    where: { isAvailable: true, archivedAt: null },
    select: { slug: true, updatedAt: true },
  });

  const vehiclePages = vehicles.map((vehicle) => ({
    url: `${baseUrl}/vehicles/${vehicle.slug}`,
    lastModified: vehicle.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const seoPages = [
    '/car-rental-islamabad',
    '/car-rental-rawalpindi',
    '/car-rental-lahore',
    '/self-drive-car-rental-pakistan',
    '/chauffeur-service-pakistan',
    '/airport-transfer-islamabad',
    '/corporate-car-rental-pakistan',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Published blog posts only - drafts and archived posts are never listed.
  const blogPosts = await prisma.blogPost.findMany({
    where: { isPublished: true, archivedAt: null, publishedAt: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...vehiclePages, ...seoPages, ...blogPages];
}