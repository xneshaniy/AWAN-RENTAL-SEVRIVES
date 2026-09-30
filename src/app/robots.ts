import { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/booking/success/', '/_next/', '/static/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}