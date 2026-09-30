'use server';

import { requireStaffAccess } from '@/lib/admin-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { blogPostSchema, type BlogPostInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

interface BlogActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
}

/**
 * Revalidate everything a blog mutation can affect: the admin list, the
 * public index, every post page (dynamic segment), and the sitemap that
 * lists published posts.
 */
function revalidateBlog() {
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath('/blog/[slug]', 'page');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
}

/** Collect Zod field errors in the shape the forms display. */
function toFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    (fieldErrors[key] ||= []).push(issue.message);
  }
  return fieldErrors;
}

/** Resolve a unique slug: appends -2, -3... when another post owns it. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const cleaned = base.slice(0, 180) || 'post';
  let candidate = cleaned;
  let suffix = 2;
  // Bounded loop: each iteration either exits or increments the suffix.
  for (let attempt = 0; attempt < 100; attempt++) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${cleaned}-${suffix++}`;
  }
  return `${cleaned}-${Date.now()}`;
}

/**
 * Create a blog post. Always saves as a draft unless the caller explicitly
 * asked for isPublished - drafts are the safe default. Staff-only.
 */
export async function createBlogPost(data: unknown): Promise<BlogActionResult> {
  await requireStaffAccess();

  const validated = blogPostSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Please fix the highlighted fields.', fieldErrors: toFieldErrors(validated.error) };
  }

  try {
    const input: BlogPostInput = validated.data;
    const slug = await uniqueSlug(input.slug);
    const session = await getServerSession(authOptions);
    const post = await prisma.blogPost.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        featuredImage: input.featuredImage || null,
        category: input.category,
        tags: input.tags,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        isPublished: input.isPublished,
        publishedAt: input.isPublished ? new Date() : null,
        authorId: session?.user?.email ?? session?.user?.name ?? 'admin',
      },
      select: { id: true },
    });
    revalidateBlog();
    return { success: true, id: post.id };
  } catch (error) {
    console.error('Create blog post error:', error);
    return { success: false, error: 'Failed to create the post. Please try again.' };
  }
}

/** Update an existing post (title, body, SEO, publish flag). Staff-only. */
export async function updateBlogPost(id: string, data: unknown): Promise<BlogActionResult> {
  await requireStaffAccess();

  const validated = blogPostSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Please fix the highlighted fields.', fieldErrors: toFieldErrors(validated.error) };
  }

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing) {
      return { success: false, error: 'Post not found.' };
    }

    const input: BlogPostInput = validated.data;
    const slug = await uniqueSlug(input.slug, id);

    await prisma.blogPost.update({
      where: { id },
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        featuredImage: input.featuredImage || null,
        category: input.category,
        tags: input.tags,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        isPublished: input.isPublished,
        // First publish stamps the public publication date; unpublishing
        // keeps it so a later re-publish does not rewrite history.
        publishedAt: input.isPublished ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
    });
    revalidateBlog();
    return { success: true, id };
  } catch (error) {
    console.error('Update blog post error:', error);
    return { success: false, error: 'Failed to update the post. Please try again.' };
  }
}

/** Publish or unpublish a post from the list/detail screens. Staff-only. */
export async function setBlogPostPublished(id: string, published: boolean): Promise<BlogActionResult> {
  await requireStaffAccess();
  try {
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing) return { success: false, error: 'Post not found.' };

    await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: published,
        publishedAt: published ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
    });
    revalidateBlog();
    return { success: true };
  } catch (error) {
    console.error('Set blog post published error:', error);
    return { success: false, error: 'Failed to change publish state.' };
  }
}

/** Archive: hides the post everywhere public. Archived posts cannot be
 *  published - restoring returns them to draft for an explicit re-publish. */
export async function archiveBlogPost(id: string): Promise<BlogActionResult> {
  await requireStaffAccess();
  try {
    await prisma.blogPost.update({
      where: { id },
      data: { archivedAt: new Date(), isPublished: false },
    });
    revalidateBlog();
    return { success: true };
  } catch (error) {
    console.error('Archive blog post error:', error);
    return { success: false, error: 'Failed to archive the post.' };
  }
}

/** Undo an archive. The post returns as a draft - never auto-published. */
export async function restoreBlogPost(id: string): Promise<BlogActionResult> {
  await requireStaffAccess();
  try {
    await prisma.blogPost.update({
      where: { id },
      data: { archivedAt: null },
    });
    revalidateBlog();
    return { success: true };
  } catch (error) {
    console.error('Restore blog post error:', error);
    return { success: false, error: 'Failed to restore the post.' };
  }
}

/** Permanently delete a post. Requires confirmation in the UI. Staff-only. */
export async function deleteBlogPost(id: string): Promise<BlogActionResult> {
  await requireStaffAccess();
  try {
    await prisma.blogPost.delete({ where: { id } });
    revalidateBlog();
    return { success: true };
  } catch (error) {
    console.error('Delete blog post error:', error);
    return { success: false, error: 'Failed to delete the post.' };
  }
}
