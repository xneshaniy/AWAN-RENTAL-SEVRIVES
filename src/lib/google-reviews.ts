/**
 * Live Google Reviews for the homepage (server-side only).
 *
 * The section renders real data straight from Google's Places API (New).
 * Nothing here invents ratings, counts or quotes: when Google cannot be
 * reached, or the feature has not been configured, every helper returns
 * `null` so the caller can hide the section instead of showing a fake one.
 *
 * Configuration (both server-only, never NEXT_PUBLIC_*, never committed):
 *
 *   GOOGLE_PLACES_API_KEY  Google Cloud API key with "Places API (New)" enabled
 *   GOOGLE_PLACE_ID        Place ID of the business listing
 *
 * Responses are cached for 12 hours via the Next.js data cache, so a busy
 * homepage stays at roughly two requests per day - comfortably inside the
 * Places API free monthly allowance.
 */

/** Most reviews a single Place Details response can return. */
const MAX_REVIEWS = 5;

/** How long a fetched listing stays fresh (seconds). */
const REVIEWS_REVALIDATE_SECONDS = 60 * 60 * 12;

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places/';

/**
 * Only the fields we render. `reviews` is the expensive field, so the mask
 * also keeps us on the cheapest possible SKU for the request.
 */
const REVIEWS_FIELD_MASK = ['rating', 'userRatingCount', 'reviews', 'googleMapsUri', 'displayName'].join(',');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/** A single Google review, flattened into what the section needs. */
export interface GoogleReview {
  /** Reviewer display name as Google reports it. */
  author: string;
  /** Whole stars (0-5) this reviewer left. */
  rating: number;
  /** Review body. Rating-only reviews are dropped upstream, so never empty. */
  text: string;
  /** Google-style wording such as "2 months ago"; empty when unknown. */
  relativeTime: string;
}

/** Flattened Place Details data used by the homepage section. */
export interface GoogleReviewsData {
  /** Average rating (0-5), or `null` when Google reports no average yet. */
  rating: number | null;
  /** How many people left a rating in total. */
  ratingCount: number;
  /** Up to {@link MAX_REVIEWS} quoted reviews. */
  reviews: GoogleReview[];
  /** Link to the full listing, so visitors can read every review. */
  mapsUrl: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Stars to draw as filled out of five (rounds to the nearest whole star) and
 * clamped so a malformed value can never break the layout.
 */
export function roundedRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

/**
 * Turns a Google `publishTime` into human wording ("3 weeks ago").
 * Returns an empty string for anything that is not a parseable date, so a
 * bad timestamp degrades to "no date shown" rather than "Invalid Date".
 */
export function relativeTimeFrom(publishTime: unknown, now: number = Date.now()): string {
  if (typeof publishTime !== 'string') return '';

  const publishedAt = Date.parse(publishTime);
  if (Number.isNaN(publishedAt)) return '';

  const elapsed = Math.max(0, now - publishedAt);
  if (elapsed < HOUR_MS) return 'just now';
  if (elapsed < DAY_MS) return `${plural(Math.floor(elapsed / HOUR_MS), 'hour')} ago`;
  if (elapsed < WEEK_MS) return `${plural(Math.floor(elapsed / DAY_MS), 'day')} ago`;
  if (elapsed < MONTH_MS) return `${plural(Math.floor(elapsed / WEEK_MS), 'week')} ago`;
  if (elapsed < YEAR_MS) return `${plural(Math.floor(elapsed / MONTH_MS), 'month')} ago`;
  return `${plural(Math.floor(elapsed / YEAR_MS), 'year')} ago`;
}

function relativeTimeOf(review: UnknownRecord): string {
  const described = asString(review.relativePublishTimeDescription);
  if (described) return described;
  return relativeTimeFrom(review.publishTime);
}

/**
 * Flattens a raw Place Details payload into {@link GoogleReviewsData}.
 *
 * Pure and defensive on purpose: it accepts `unknown` because it runs at the
 * edge of the network, and it returns `null` whenever there is nothing honest
 * to display (no average, no ratings, no quotable review text).
 *
 * @param payload           Parsed Place Details JSON.
 * @param fallbackMapsUrl   Listing URL from settings, used when Google omits
 *                          `googleMapsUri` (for example on a partial response).
 */
export function mapPlaceToReviews(payload: unknown, fallbackMapsUrl = ''): GoogleReviewsData | null {
  const place = asRecord(payload);
  if (!place) return null;

  const rating = asFiniteNumber(place.rating);
  const ratingCount = asFiniteNumber(place.userRatingCount) ?? 0;
  const mapsUrl = asString(place.googleMapsUri) ?? fallbackMapsUrl;

  const rawReviews = Array.isArray(place.reviews) ? place.reviews : [];
  const reviews: GoogleReview[] = [];

  for (const raw of rawReviews) {
    if (reviews.length >= MAX_REVIEWS) break;

    const review = asRecord(raw);
    if (!review) continue;

    // Google can return rating-only reviews with no body; a card needs a quote.
    const textBlock = asRecord(review.text);
    const text = textBlock ? asString(textBlock.text) : asString(review.text);
    if (!text) continue;

    const stars = asFiniteNumber(review.rating);
    if (stars === null) continue;

    const attribution = asRecord(review.authorAttribution);
    const author = attribution ? asString(attribution.displayName) : null;

    reviews.push({
      author: author ?? 'Google user',
      rating: Math.min(5, Math.max(0, Math.round(stars))),
      text,
      relativeTime: relativeTimeOf(review),
    });
  }

  if (rating === null && ratingCount <= 0 && reviews.length === 0) return null;

  return { rating, ratingCount, reviews, mapsUrl };
}

/** True only when both server-side variables are present. */
export function isGoogleReviewsConfigured(): boolean {
  const { apiKey, placeId } = getGoogleReviewsConfig();
  return apiKey.length > 0 && placeId.length > 0;
}

function getGoogleReviewsConfig(): { apiKey: string; placeId: string } {
  return {
    apiKey: process.env.GOOGLE_PLACES_API_KEY?.trim() ?? '',
    placeId: process.env.GOOGLE_PLACE_ID?.trim() ?? '',
  };
}

/**
 * Fetches the listing's reviews from Google.
 *
 * Never throws and never rejects with a partial result: an unconfigured
 * feature, a quota error or a network outage all resolve to `null`, which the
 * caller renders as a hidden section. Errors are logged as a status code only
 * so no credential material can reach the logs.
 */
export async function getGoogleReviews(fallbackMapsUrl = ''): Promise<GoogleReviewsData | null> {
  const { apiKey, placeId } = getGoogleReviewsConfig();
  if (!apiKey || !placeId) return null;

  try {
    const response = await fetch(`${PLACES_ENDPOINT}${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': REVIEWS_FIELD_MASK,
      },
      next: { revalidate: REVIEWS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.warn(`[google-reviews] Google Places API responded with status ${response.status}`);
      return null;
    }

    const payload: unknown = await response.json();
    return mapPlaceToReviews(payload, fallbackMapsUrl);
  } catch (error) {
    console.warn('[google-reviews] could not load reviews:', error instanceof Error ? error.message : 'network error');
    return null;
  }
}
