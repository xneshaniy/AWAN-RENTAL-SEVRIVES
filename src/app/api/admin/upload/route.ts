import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_BYTES,
  CloudinaryError,
  allowUpload,
  isCloudinaryConfigured,
  uploadImage,
  uploadVideo,
  validateImageFile,
  validateVideoFile,
} from '@/lib/cloudinary';

export const runtime = 'nodejs';

/** Which media kind the caller is uploading; anything else is rejected. */
function isVideoKind(value: FormDataEntryValue | null): boolean {
  return typeof value === 'string' && value === 'video';
}

/**
 * `GET` reports whether uploads are configured, so the admin form can show the
 * "Upload photo" button only when it will actually work instead of failing on
 * click with a 503.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    configured: isCloudinaryConfigured(),
    maxBytes: MAX_UPLOAD_BYTES,
    maxVideoBytes: MAX_VIDEO_BYTES,
  });
}

/**
 * `POST` accepts `multipart/form-data` with a single `file` part (plus an
 * optional `kind` field, `image` or `video`) and returns the CDN URL to paste
 * into the vehicle gallery.
 *
 * Multipart is used rather than a server action so there is no framework body
 * size ceiling above `MAX_UPLOAD_BYTES` / `MAX_VIDEO_BYTES` - a phone photo
 * must not silently fail at 1 MB, and a clip must not fail at the photo limit.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Capped per IP: each upload is a paid third-party call.
  if (!(await allowUpload(request))) {
    return NextResponse.json(
      { error: 'Too many uploads from this network. Please wait and try again.' },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart form data with a "file" field.' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  // Duck-typed rather than `instanceof File`: the global differs between the
  // undici build that parses the body and the one that runs this handler.
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 });
  }

  // Photos and clips share one endpoint: the session check, the per-IP rate
  // limit and the response shape are identical, and only the validation plus
  // the Cloudinary resource type differ. `kind` is an ordinary form field so
  // an unrecognised value falls back to the stricter photo rules.
  const video = isVideoKind(formData.get('kind'));
  const invalid = video ? validateVideoFile(file) : validateImageFile(file);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const result = video ? await uploadVideo(file) : await uploadImage(file);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(video ? 'Vehicle video upload failed:' : 'Vehicle image upload failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
