import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  MAX_UPLOAD_BYTES,
  CloudinaryError,
  allowUpload,
  isCloudinaryConfigured,
  uploadImage,
  validateImageFile,
} from '@/lib/cloudinary';

export const runtime = 'nodejs';

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
  });
}

/**
 * `POST` accepts `multipart/form-data` with a single `file` part and returns
 * the CDN URL to paste into the vehicle gallery.
 *
 * Multipart is used rather than a server action so there is no framework body
 * size ceiling above `MAX_UPLOAD_BYTES` - a phone photo must not silently fail
 * at 1 MB.
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

  const invalid = validateImageFile(file);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const result = await uploadImage(file);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CloudinaryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Vehicle image upload failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
