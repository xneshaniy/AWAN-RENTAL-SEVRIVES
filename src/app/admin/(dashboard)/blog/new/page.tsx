import type { Metadata } from 'next';
import { BlogPostForm } from '@/components/admin/BlogPostForm';

export const metadata: Metadata = {
  title: 'New Blog Post',
  robots: { index: false, follow: false },
};

export default function NewBlogPostPage() {
  return <BlogPostForm mode="create" />;
}
