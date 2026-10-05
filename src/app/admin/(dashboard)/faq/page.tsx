import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireStaffAccess } from '@/lib/admin-auth';
import { FaqManager } from '@/components/admin/FaqManager';

export const metadata: Metadata = {
  title: 'FAQ',
  robots: { index: false, follow: false },
};

/**
 * Admin CRUD screen for the FAQ records behind /faq and the FAQ block on
 * /self-drive. The dashboard layout already rejects anonymous and non-staff
 * visitors; requireStaffAccess() repeats the check here so a future route
 * group change cannot silently expose the data.
 */
export default async function AdminFaqPage() {
  await requireStaffAccess();

  const faqs = await prisma.fAQ.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
    select: {
      id: true,
      question: true,
      answer: true,
      category: true,
      order: true,
      isActive: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Questions marked visible appear on the public FAQ page and are published as
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">FAQPage</code>
          structured data for search engines.
        </p>
      </div>

      <FaqManager initialFaqs={faqs} />
    </div>
  );
}
