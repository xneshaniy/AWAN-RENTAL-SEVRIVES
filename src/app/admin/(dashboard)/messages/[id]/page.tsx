import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Mail, Phone, MessageCircle, User as UserIcon } from 'lucide-react';
import { MessageActions } from '@/components/admin/MessageActions';

export const metadata: Metadata = {
  title: 'Message',
  robots: { index: false, follow: false },
};

/** Single contact message, full text plus read/resolved/archive controls. */
export default async function AdminMessageDetailPage({ params }: { params: { id: string } }) {
  const message = await prisma.contactMessage.findUnique({ where: { id: params.id } });
  if (!message) notFound();

  const phoneDigits = message.phone.replace(/\D/g, '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/messages"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Messages
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            {message.subject}
          </h1>
          <Badge
            variant={
              message.status === 'RESOLVED'
                ? 'success'
                : message.status === 'ARCHIVED'
                  ? 'outline'
                  : 'warning'
            }
          >
            {message.status}
          </Badge>
          {!message.isRead && <Badge variant="info">Unread</Badge>}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Received {formatDate(message.createdAt)}
        </p>
      </div>

      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <MessageActions messageId={message.id} isRead={message.isRead} status={message.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Sender
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{message.name}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              {message.email ? (
                <a
                  href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {message.email}
                </a>
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">
                  Not provided (WhatsApp contact)
                </p>
              )}
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Phone</p>
              {phoneDigits ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${message.phone}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {message.phone}
                  </a>
                  <a
                    href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                      `Hello ${message.name}, this is Awan Rental Service regarding your message.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-green-600 hover:text-green-700"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                </div>
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">—</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {message.message}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
