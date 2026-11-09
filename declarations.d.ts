/**
 * Module declarations for third-party packages that ship no type
 * declarations in the installed versions. Kept minimal but permissive —
 * they exist so `tsc --noEmit` is useful instead of noisy.
 */

declare module 'clsx' {
  export type ClassValue =
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | ClassValue[]
    | Record<string, unknown>;

  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}

declare module '@hookform/resolvers/zod' {
  import type { Resolver, FieldValues } from 'react-hook-form';
  export function zodResolver<TFieldValues extends FieldValues = FieldValues>(
    schema: unknown,
    schemaOptions?: unknown,
    resolverOptions?: unknown
  ): Resolver<TFieldValues>;
}

declare module 'react-hot-toast' {
  import type { FC, ReactNode } from 'react';

  export interface ToastOptions {
    duration?: number;
    position?: string;
    className?: string;
    style?: Record<string, string | number>;
    id?: string;
    iconTheme?: { primary?: string; secondary?: string };
  }

  export interface Toast {
    id: string;
    type: 'blank' | 'success' | 'error' | 'loading' | 'custom';
    message: ReactNode;
    duration?: number;
    createdAt: number;
  }

  type ToastFn = {
    (message: ReactNode, options?: ToastOptions): string;
    success(message: ReactNode, options?: ToastOptions): string;
    error(message: ReactNode, options?: ToastOptions): string;
    loading(message: ReactNode, options?: ToastOptions): string;
    custom(message: ReactNode): string;
    dismiss(id?: string): void;
    remove(id?: string): void;
    promise<T>(
      promise: Promise<T> | (() => Promise<T>),
      messages: {
        loading: ReactNode;
        success: ReactNode | ((data: T) => ReactNode);
        error: ReactNode | ((error: unknown) => ReactNode);
      }
    ): Promise<T>;
  };

  export const toast: ToastFn;
  export const Toaster: FC<{
    position?: string;
    toastOptions?: {
      duration?: number;
      style?: Record<string, string | number>
      success?: { duration?: number; iconTheme?: { primary?: string; secondary?: string } };
      error?: { duration?: number; iconTheme?: { primary?: string; secondary?: string } };
    };
  }>;
  export default toast;
}

declare module '@axe-core/playwright' {
  import type { Page } from 'playwright';

  export interface AxeViolation {
    id: string;
    impact: string | null;
    description: string;
    nodes: Array<{ html: string; target: string[] }>;
  }

  export interface AxeResults {
    violations: AxeViolation[];
  }

  export default class AxeBuilder {
    constructor(options: { page: Page });
    withTags(tags: string[]): AxeBuilder;
    analyze(): Promise<AxeResults>;
  }
}
