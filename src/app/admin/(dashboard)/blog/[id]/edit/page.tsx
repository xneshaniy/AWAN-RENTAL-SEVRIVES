import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BlogPostForm } from '@/components/admin/BlogPostForm';

export const metadata: Metadata = {
  title: 'Edit Blog Post',
  robots: { index: false, follow: false },
};

interface EditBlogPostPageProps {
  params: { id: string };
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  return (
    <BlogPostForm
      mode="edit"
      postId={post.id}
      initial={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage ?? '',
        category: post.category,
        tags: post.tags,
        seoTitle: post.seoTitle ?? '',
        seoDescription: post.seoDescription ?? '',
        isPublished: post.isPublished,
      }}
    />
  );
}
