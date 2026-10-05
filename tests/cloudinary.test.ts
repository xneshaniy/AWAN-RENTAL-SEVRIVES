import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  MAX_UPLOAD_BYTES,
  cloudinarySignature,
  isCloudinaryConfigured,
  validateImageFile,
} from '@/lib/cloudinary';

/**
 * Unit tests for the Cloudinary upload helper (`@/lib/cloudinary`).
 *
 * Nothing here touches the network or the database: the point is to pin the
 * signing format (a silent change would break every production upload) and the
 * pre-flight validation that decides which files are allowed to leave the
 * server at all.
 */

/** Shaped like the parts of `File` that validation reads. */
function fakeFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  return { name: 'car.jpg', type: 'image/jpeg', size: 1024, ...overrides };
}

describe('cloudinarySignature', () => {
  test('matches the documented sha1(sorted key=value + secret) format', () => {
    // Known-answer vector: any refactor of the concatenation order must fail
    // here rather than in production, where Cloudinary would reject uploads
    // with an opaque "Invalid signature".
    const signature = cloudinarySignature(
      { folder: 'awan-rental/vehicles', timestamp: 1770000000 },
      'test-secret'
    );
    assert.equal(signature, 'c33eb60136b133f5877e7267defd601dcde5cb3a');
  });

  test('is independent of the insertion order of the parameters', () => {
    const a = cloudinarySignature({ folder: 'x', timestamp: 1 }, 's');
    const b = cloudinarySignature({ timestamp: 1, folder: 'x' }, 's');
    assert.equal(a, b, 'Cloudinary sorts parameters before signing - so must we');
  });

  test('a different secret produces a different signature', () => {
    const withSecret = cloudinarySignature({ folder: 'x', timestamp: 1 }, 'secret-one');
    const withOther = cloudinarySignature({ folder: 'x', timestamp: 1 }, 'secret-two');
    assert.notEqual(withSecret, withOther);
    assert.match(withSecret, /^[0-9a-f]{40}$/, 'must be a lowercase sha1 hex digest');
  });

  test('tampering with any signed parameter invalidates the signature', () => {
    const base = cloudinarySignature({ folder: 'awan-rental/vehicles', timestamp: 1770000000 }, 's');
    const movedFolder = cloudinarySignature(
      { folder: 'some-other-destination', timestamp: 1770000000 },
      's'
    );
    const movedTimestamp = cloudinarySignature(
      { folder: 'awan-rental/vehicles', timestamp: 1770000001 },
      's'
    );

    assert.notEqual(base, movedFolder, 'the folder must be covered by the signature');
    assert.notEqual(base, movedTimestamp, 'the timestamp must be covered by the signature');
  });
});

describe('validateImageFile', () => {
  test('accepts a normal JPEG within the size limit', () => {
    assert.equal(validateImageFile(fakeFile()), null);
  });

  test('accepts every supported image MIME type', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']) {
      assert.equal(validateImageFile(fakeFile({ type })), null, `${type} should be allowed`);
    }
  });

  test('rejects a non-image file with an actionable message', () => {
    const message = validateImageFile(fakeFile({ name: 'car.svg', type: 'image/svg+xml' }));
    assert.ok(message, 'an unsupported type must be explained, not silently dropped');
    assert.match(message, /JPEG, PNG, WebP, AVIF or GIF/);
  });

  test('rejects an empty file', () => {
    assert.match(validateImageFile(fakeFile({ size: 0 })) ?? '', /empty/);
  });

  test('rejects a file above the size ceiling and names the limit', () => {
    const message = validateImageFile(fakeFile({ size: MAX_UPLOAD_BYTES + 1 }));
    assert.ok(message, 'oversized uploads must be rejected before the network call');
    assert.match(message, /too large/);
    assert.match(message, /8 MB/);
  });

  test('a file exactly at the limit is still allowed', () => {
    assert.equal(validateImageFile(fakeFile({ size: MAX_UPLOAD_BYTES })), null);
  });
});

describe('isCloudinaryConfigured', () => {
  test('reflects whether all three credentials are present', () => {
    // Asserted against the environment rather than a fixed value so the test
    // holds both for a configured machine and for CI without secrets.
    const expected = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
    assert.equal(isCloudinaryConfigured(), expected);
  });
});
