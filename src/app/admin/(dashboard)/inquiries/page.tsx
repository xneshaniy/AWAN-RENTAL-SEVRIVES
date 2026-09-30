import { redirect } from 'next/navigation';

/**
 * The legacy Inquiry inbox has been merged into the unified ContactMessage
 * inbox: every contact form, quote request and airport-transfer request now
 * writes there. This route forwards old bookmarks.
 */
export default function AdminInquiriesPage() {
  redirect('/admin/messages');
}
