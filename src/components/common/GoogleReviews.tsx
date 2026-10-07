import { ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  getGoogleReviews,
  roundedRating,
  type GoogleReview,
  type GoogleReviewsData,
} from '@/lib/google-reviews';

/**
 * Homepage "live Google reviews" section (server component).
 *
 * Fetches happen on the server so GOOGLE_PLACES_API_KEY never reaches the
 * browser. Three states, in order:
 *
 *   1. Configured and Google answered  -> rating summary + up to 3 quotes
 *   2. Not configured / Google failed, but a listing URL exists -> link card
 *   3. Nothing known about the listing -> renders nothing at all
 *
 * The section therefore never displays a rating we cannot back up with a
 * real response from Google.
 */

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const filled = roundedRating(rating);
  const dimension = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';

  return (
    <span role="img" aria-label={`Rated ${rating} out of 5`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={
            star <= filled
              ? `${dimension} fill-amber-400 text-amber-400`
              : `${dimension} fill-transparent text-gray-300 dark:text-gray-600`
          }
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const initial = review.author.trim().charAt(0).toUpperCase() || 'G';

  return (
    <Card padding="lg" className="h-full">
      <figure className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <Stars rating={review.rating} />
          {review.relativeTime && (
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{review.relativeTime}</span>
          )}
        </div>

        <blockquote className="mt-4 flex-1 text-gray-600 dark:text-gray-300">
          <p className="line-clamp-4">&ldquo;{review.text}&rdquo;</p>
        </blockquote>

        <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-heading text-sm font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          >
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
              {review.author}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">Google review</span>
          </span>
        </figcaption>
      </figure>
    </Card>
  );
}

/** State 2: no live data yet, but we know where the listing lives. */
function ReviewsLinkCard({ mapsUrl }: { mapsUrl: string }) {
  return (
    <section className="bg-cream-100 py-12 dark:bg-gray-900/50 sm:py-16" aria-labelledby="google-reviews-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="google-reviews-title"
              className="font-heading text-2xl font-bold text-gray-900 dark:text-white"
            >
              See Our Reviews on Google
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Read what our customers say about us on our Google listing.
            </p>
          </div>
          <Button variant="primary" asChild className="shrink-0">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Read Google Reviews
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </Card>
      </div>
    </section>
  );
}

/** State 1: real data straight from Google. */
function LiveReviews({
  data,
  fallbackMapsUrl,
}: {
  data: GoogleReviewsData;
  fallbackMapsUrl: string;
}) {
  const href = data.mapsUrl || fallbackMapsUrl;
  const quotes = data.reviews.slice(0, 3);
  const countLabel =
    data.ratingCount > 0 ? `Read all ${data.ratingCount} reviews on Google` : 'See our reviews on Google';

  return (
    <section
      className="bg-cream-100 py-16 dark:bg-gray-900/50 sm:py-24"
      aria-labelledby="google-reviews-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            Live from Google
          </span>
          <h2
            id="google-reviews-title"
            className="mb-4 font-heading text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl"
          >
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Real reviews from our Google listing, refreshed automatically.
          </p>
        </div>

        {data.rating !== null && (
          <div className="mb-10 flex flex-col items-center gap-2">
            <span className="font-heading text-5xl font-bold text-gray-900 dark:text-white">
              {data.rating.toFixed(1)}
            </span>
            <Stars rating={data.rating} size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on {data.ratingCount} Google review{data.ratingCount === 1 ? '' : 's'}
            </p>
          </div>
        )}

        {quotes.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.map((review, index) => (
              <ReviewCard key={`${review.author}-${index}`} review={review} />
            ))}
          </div>
        )}

        {href && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button variant="outline" asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {countLabel}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Review data provided by{' '}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Google Maps
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Renders the section. Call from a server component.
 *
 * @param fallbackMapsUrl Listing URL from site settings, used when Google
 *                        does not return a maps link of its own.
 */
export async function GoogleReviews({ fallbackMapsUrl }: { fallbackMapsUrl?: string }) {
  const mapsUrl = fallbackMapsUrl?.trim() ?? '';
  const data = await getGoogleReviews(mapsUrl);

  if (data) return <LiveReviews data={data} fallbackMapsUrl={mapsUrl} />;
  if (mapsUrl) return <ReviewsLinkCard mapsUrl={mapsUrl} />;

  return null;
}
