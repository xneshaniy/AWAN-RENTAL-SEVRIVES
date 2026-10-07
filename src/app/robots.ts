import { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

/**
 * What `/robots.txt` tells a crawler about this site.
 *
 * The catch-all `*` group already covers every AI engine, but the AI crawlers
 * are also named individually below. The reason is auditable intent: an
 * operator (or an audit tool) should be able to see in one place that ChatGPT,
 * Gemini, Claude, Perplexity and Common Crawl are *wanted*, instead of having
 * to infer it from a wildcard - and a future blanket `Disallow: /` on the `*`
 * group would silently take the site out of every AI answer while the code
 * still looked fine.
 *
 * IMPORTANT - robots.txt group semantics. A crawler uses ONLY the most
 * specific group that names it; groups are never merged. That means every
 * named group below has to repeat the full `disallow` list. Drop it from the
 * AI group and GPTBot et al. would be allowed to walk /admin/ and /api/,
 * which the `*` group had been blocking. This is the classic robots.txt
 * escalation bug, so the list lives in one shared constant.
 *
 * This file only decides *who may read*. What they read is the content itself:
 * `public/llms.txt`, `sitemap.xml`, the site-wide JSON-LD graph and the pages.
 */
const DISALLOW = ['/admin/', '/api/', '/booking/success/', '/_next/', '/static/'];

/**
 * User agents that fetch pages for an AI assistant, an answer engine or a
 * training corpus. Grouped by operator so the list stays readable.
 */
const AI_CRAWLERS = [
  // OpenAI: GPTBot trains, OAI-SearchBot indexes for search, ChatGPT-User
  // fetches on behalf of a person in a conversation.
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic: ClaudeBot is the index/training crawler.
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  // Perplexity: the index crawler plus the live user-triggered fetcher.
  'PerplexityBot',
  'Perplexity-User',
  // Google: Google-Extended gates training/grounding reuse of site content.
  // Gemini search itself crawls as Googlebot, which the `*` group covers.
  'Google-Extended',
  // Common Crawl: the public corpus most open models are trained on.
  'CCBot',
  // Apple: on-device intelligence, separate from the Applebot web crawler.
  'Applebot-Extended',
  // Other assistants and indexers that read the open web.
  'Bytespider',
  'meta-externalagent',
  'Amazonbot',
  'cohere-ai',
  'YouBot',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      // Same permissions as `*`, stated explicitly for the AI engines.
      { userAgent: AI_CRAWLERS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
