import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { clientIpFromHeaders } from '@/lib/rate-limit';
import { rateLimitShared } from '@/lib/rate-limit-db';

/**
 * Cloudinary upload, signed server-side.
 *
 * The `api_secret` never leaves this process and there is no Cloudinary SDK:
 * the signed-upload contract is just a SHA-1 over the sorted parameters plus
 * the secret, which keeps the dependency surface at zero. `api_key` and the
 * resulting `secure_url` are safe to send to the browser; only the secret is
 * not, and it is only ever read from the environment.
 *
 * When the three CLOUDINARY_* variables are absent the rest of the admin
 * vehicle form keeps working exactly as before (paste an image URL), so an
 * unconfigured deployment degrades rather than breaks.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** JPEG/PNG/WebP/AVIF/GIF - everything a fleet photo realistically is. */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

/** 8 MB. Cloudinary's own free-tier ceiling is 10 MB; leave headroom. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export class CloudinaryError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'CloudinaryError';
  }
}

/** True only when all three credentials are present. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Build the Cloudinary upload signature.
 *
 * Exported so it can be unit-tested without touching the network: given the
 * same parameters and secret, Cloudinary expects
 * `sha1(sorted`key=value` joined by `&` + api_secret)`.
 */
export function cloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Validate a browser-supplied file before any bytes reach Cloudinary.
 * Returns a human-readable reason, or `null` when the file is acceptable.
 */
export function validateImageFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Unsupported file type. Use a JPEG, PNG, WebP, AVIF or GIF image.';
  }
  if (file.size === 0) {
    return 'That file is empty. Please choose an image.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(file.size / (1024 * 1024));
    return `Image is too large (${mb} MB). The maximum is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

/** Throw a `CloudinaryError` when the feature is not configured. */
export function assertCloudinaryConfigured(): void {
  if (isCloudinaryConfigured()) return;
  throw new CloudinaryError(
    'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or paste an image URL instead.',
    503
  );
}

/**
 * Upload one image and return its CDN URL.
 *
 * Only `folder` is sent alongside the file, and it is included in the signed
 * parameters so Cloudinary rejects a tampered folder.
 */
export async function uploadImage(
  file: File,
  { folder = 'awan-rental/vehicles' }: { folder?: string } = {}
): Promise<UploadResult> {
  assertCloudinaryConfigured();

  const invalid = validateImageFile(file);
  if (invalid) throw new CloudinaryError(invalid, 400);

  const bytes = Buffer.from(await file.arrayBuffer());
  const timestamp = Math.floor(Date.now() / 1000);

  const signed = { folder, timestamp };
  const signature = cloudinarySignature(signed, API_SECRET!);

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(bytes)], { type: file.type }), file.name);
  form.append('api_key', API_KEY!);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new CloudinaryError(
      'Could not reach the image storage service. Check the network and try again.',
      502
    );
  }

  if (!response.ok) {
    // Cloudinary's error payload is { error: { message } }; fall back to the
    // status text so a malformed body still produces something actionable.
    let detail = `Upload failed (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body?.error?.message) detail = body.error.message;
    } catch {
      /* keep the status-based message */
    }
    throw new CloudinaryError(detail, response.status);
  }

  const data = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    bytes?: number;
  };

  if (!data.secure_url) {
    throw new CloudinaryError('The upload succeeded but no image URL came back.', 502);
  }

  return {
    url: data.secure_url,
    publicId: data.public_id ?? '',
    width: data.width ?? 0,
    height: data.height ?? 0,
    bytes: data.bytes ?? 0,
  };
}

/**
 * Per-IP cap on uploads. Every vehicle photo costs a third-party round trip,
 * so an accidental loop (or a scripted abuse) must not turn into an
 * unbounded Cloudinary bill.
 */
export async function allowUpload(request: NextRequest): Promise<boolean> {
  const ip = clientIpFromHeaders(request.headers);
  return rateLimitShared(`upload:${ip}`, { limit: 25, windowMs: 60 * 60 * 1000 });
}
