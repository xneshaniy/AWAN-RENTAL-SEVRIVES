import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  getGoogleReviews,
  isGoogleReviewsConfigured,
  mapPlaceToReviews,
  relativeTimeFrom,
  roundedRating,
} from '@/lib/google-reviews';

/**
 * Unit tests for the live Google reviews library (`@/lib/google-reviews`).
 *
 * The section must never display a rating, a review count or a quote that
 * Google did not actually return, and it must never break the homepage when
 * the feature is unconfigured or Google is unreachable. Every test here works
 * on the pure mapper or on the configuration gate - no network is used.
 */

/** A realistic Place Details (New) payload for the business listing. */
function placePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ChIJ9zcES-QJGTkRAzHlfjTCaG8',
    displayName: { text: 'Awan Rental Service', languageCode: 'en' },
    rating: 5,
    userRatingCount: 39,
    googleMapsUri: 'https://www.google.com/maps/place/?q=place_id:ChIJ9zcES-QJGTkRAzHlfjTCaG8',
    reviews: [
      {
        authorAttribution: { displayName: 'Malik Umair' },
        rating: 5,
        relativePublishTimeDescription: '5 months ago',
        text: {
          text: 'The car was clean, comfortable and well maintained. Driver was very polite and on time.',
          languageCode: 'en',
        },
      },
      {
        authorAttribution: { displayName: 'Umer Rehman' },
        rating: 5,
        publishTime: '2026-08-01T10:00:00.000Z',
        text: { text: 'Nice car, nice driver, good service. Recommended.', languageCode: 'en' },
      },
      // Google can return rating-only reviews with an empty body.
      {
        authorAttribution: { displayName: 'Star Only' },
        rating: 5,
        text: { text: '   ' },
      },
    ],
    ...overrides,
  };
}

/** Passes when a derived relative time looks like "3 days ago" or "just now". */
function isRelativeTime(value: unknown): boolean {
  return typeof value === 'string' && /^(just now|\d+ (hour|day|week|month|year)s? ago)$/.test(value);
}

describe('mapPlaceToReviews', () => {
  test('flattens a Place Details payload into the view model', () => {
    const data = mapPlaceToReviews(placePayload());

    assert.ok(data, 'expected a usable view model');
    assert.equal(data.rating, 5);
    assert.equal(data.ratingCount, 39);
    assert.equal(
      data.mapsUrl,
      'https://www.google.com/maps/place/?q=place_id:ChIJ9zcES-QJGTkRAzHlfjTCaG8'
    );

    assert.equal(data.reviews.length, 2, 'rating-only reviews must be dropped');
    assert.equal(data.reviews[0].author, 'Malik Umair');
    assert.equal(data.reviews[0].rating, 5);
    assert.equal(data.reviews[0].relativeTime, '5 months ago');
    assert.match(data.reviews[0].text, /well maintained/);

    // No relativePublishTimeDescription on the second review: derived instead.
    assert.equal(data.reviews[1].author, 'Umer Rehman');
    assert.ok(isRelativeTime(data.reviews[1].relativeTime), 'derived relative time');
  });

  test('falls back to the settings listing URL when Google omits googleMapsUri', () => {
    const data = mapPlaceToReviews(placePayload({ googleMapsUri: undefined }), 'https://maps.app.goo.gl/xyz');
    assert.ok(data);
    assert.equal(data.mapsUrl, 'https://maps.app.goo.gl/xyz');
  });

  test('keeps an absent average absent instead of inventing one', () => {
    const data = mapPlaceToReviews(placePayload({ rating: undefined }), 'https://example.com');
    assert.ok(data, 'reviews alone are still worth rendering');
    assert.equal(data.rating, null, 'must not invent an average rating');
    assert.equal(data.ratingCount, 39);
  });

  test('caps the quote list at five and clamps out-of-range star ratings', () => {
    const manyReviews = Array.from({ length: 8 }, (_, index) => ({
      authorAttribution: { displayName: `Reviewer ${index}` },
      rating: index % 2 === 0 ? 5 : 9,
      text: { text: `Review body number ${index}.` },
    }));

    const data = mapPlaceToReviews(placePayload({ reviews: manyReviews }));
    assert.ok(data);
    assert.equal(data.reviews.length, 5);
    for (const review of data.reviews) {
      assert.ok(review.rating >= 0 && review.rating <= 5, `stars out of range: ${review.rating}`);
    }
  });

  test('returns null when Google gave us nothing honest to show', () => {
    assert.equal(mapPlaceToReviews(null), null);
    assert.equal(mapPlaceToReviews(undefined), null);
    assert.equal(mapPlaceToReviews('not a place'), null);
    assert.equal(mapPlaceToReviews([]), null);
    assert.equal(mapPlaceToReviews({}), null);
    assert.equal(mapPlaceToReviews({ reviews: [] }), null);
    assert.equal(mapPlaceToReviews({ userRatingCount: 0, reviews: [] }), null);
    assert.equal(
      mapPlaceToReviews({ userRatingCount: 0, reviews: [{ authorAttribution: {}, rating: 5 }] }),
      null,
      'a rating-only review with no count has nothing to render'
    );
  });
});

describe('relativeTimeFrom', () => {
  const now = Date.parse('2026-10-04T12:00:00.000Z');
  const ago = (ms: number) => new Date(now - ms).toISOString();

  test('renders Google-style wording for each unit', () => {
    assert.equal(relativeTimeFrom(ago(30 * 60 * 1000), now), 'just now');
    assert.equal(relativeTimeFrom(ago(5 * 60 * 60 * 1000), now), '5 hours ago');
    assert.equal(relativeTimeFrom(ago(1 * 60 * 60 * 1000), now), '1 hour ago');
    assert.equal(relativeTimeFrom(ago(3 * 24 * 60 * 60 * 1000), now), '3 days ago');
    assert.equal(relativeTimeFrom(ago(14 * 24 * 60 * 60 * 1000), now), '2 weeks ago');
    assert.equal(relativeTimeFrom(ago(60 * 24 * 60 * 60 * 1000), now), '2 months ago');
    assert.equal(relativeTimeFrom(ago(400 * 24 * 60 * 60 * 1000), now), '1 year ago');
  });

  test('degrades to an empty string instead of printing "Invalid Date"', () => {
    assert.equal(relativeTimeFrom(undefined, now), '');
    assert.equal(relativeTimeFrom(null, now), '');
    assert.equal(relativeTimeFrom(12345, now), '');
    assert.equal(relativeTimeFrom('some time ago', now), '');
    assert.equal(relativeTimeFrom('', now), '');
  });

  test('clamps a future timestamp rather than showing a negative age', () => {
    assert.equal(relativeTimeFrom(new Date(now + 24 * 60 * 60 * 1000).toISOString(), now), 'just now');
  });
});

describe('roundedRating', () => {
  test('rounds to the nearest whole star', () => {
    assert.equal(roundedRating(4.4), 4);
    assert.equal(roundedRating(4.6), 5);
    assert.equal(roundedRating(5), 5);
  });

  test('clamps values a broken response could throw at us', () => {
    assert.equal(roundedRating(0), 0);
    assert.equal(roundedRating(9), 5);
    assert.equal(roundedRating(-3), 0);
    assert.equal(roundedRating(Number.NaN), 0);
    assert.equal(roundedRating(Infinity), 0);
  });
});

describe('configuration gate', () => {
  test('stays unconfigured until both server-side variables are set', async () => {
    const originalKey = process.env.GOOGLE_PLACES_API_KEY;
    const originalPlaceId = process.env.GOOGLE_PLACE_ID;

    try {
      delete process.env.GOOGLE_PLACES_API_KEY;
      delete process.env.GOOGLE_PLACE_ID;

      assert.equal(isGoogleReviewsConfigured(), false);
      assert.equal(
        await getGoogleReviews('https://maps.app.goo.gl/example'),
        null,
        'an unconfigured feature must resolve to null, not a fake payload'
      );

      process.env.GOOGLE_PLACE_ID = 'ChIJ9zcES-QJGTkRAzHlfjTCaG8';
      assert.equal(isGoogleReviewsConfigured(), false, 'a place ID on its own is not enough');

      process.env.GOOGLE_PLACES_API_KEY = 'unit-test-key';
      assert.equal(isGoogleReviewsConfigured(), true);
    } finally {
      if (originalKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
      else process.env.GOOGLE_PLACES_API_KEY = originalKey;

      if (originalPlaceId === undefined) delete process.env.GOOGLE_PLACE_ID;
      else process.env.GOOGLE_PLACE_ID = originalPlaceId;
    }
  });
});
