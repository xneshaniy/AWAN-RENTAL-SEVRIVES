'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Images, Play, X } from 'lucide-react';
import { displayImageUrl, videoPosterUrl, type SelfDriveGalleryItem } from '@/lib/self-drive-gallery';

const TILE_SIZES = '(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

interface SelfDriveGalleryProps {
  items: SelfDriveGalleryItem[];
}

export function SelfDriveGallery({ items }: SelfDriveGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visible = useMemo(() => items.filter((item) => Boolean(item.url)), [items]);
  const active = activeIndex === null ? null : visible[activeIndex] ?? null;

  // Lock the page behind the lightbox.
  useEffect(() => {
    if (activeIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null);
        return;
      }
      if (visible.length < 2) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null ? current : (current - 1 + visible.length) % visible.length
        );
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null ? current : (current + 1) % visible.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, visible.length]);

  const step = (delta: number) => {
    if (visible.length < 2) return;
    setActiveIndex((current) =>
      current === null ? current : (current + delta + visible.length) % visible.length
    );
  };

  if (visible.length === 0) return null;

  return (
    <section
      className="py-16 sm:py-20 bg-cream-100 dark:bg-gray-900/50"
      aria-labelledby="media-gallery-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-medium mb-5">
              <Images className="w-4 h-4" aria-hidden="true" />
              Photo &amp; Video Gallery
            </span>
            <h2
              id="media-gallery-title"
              className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-3"
            >
              See the Self Drive Experience
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Real photos and videos from our fleet and recent client trips.
            </p>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {visible.length} item{visible.length === 1 ? '' : 's'}
          </p>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4" role="list">
          {visible.map((item, index) => {
            const isVideo = item.type === 'video';
            const poster = isVideo ? videoPosterUrl(item.url) : null;
            const caption = item.caption?.trim() || (isVideo ? 'Video' : 'Photo');
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  aria-label={isVideo ? `Play video: ${caption}` : `View photo: ${caption}`}
                >
                  <span className="relative block aspect-[4/3] w-full">
                    {isVideo ? (
                      <>
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={poster}
                            alt={`Video thumbnail: ${caption}`}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            muted
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 h-full w-full object-cover"
                            aria-hidden="true"
                          />
                        )}
                        <span className="absolute inset-0 bg-black/30" aria-hidden="true" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <Play className="ml-1 h-6 w-6" aria-hidden="true" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <Image
                        src={displayImageUrl(item.url, 800)}
                        alt={`Self drive rental - ${caption}`}
                        fill
                        sizes={TILE_SIZES}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-8">
                    <span className="block truncate text-left text-xs font-medium text-white">
                      {caption}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption?.trim() || (active.type === 'video' ? 'Video' : 'Photo')}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">
              {active.caption?.trim() || (active.type === 'video' ? 'Video' : 'Photo')}
            </p>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close gallery"
              className="rounded-full p-2 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-14">
            {visible.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous item"
                  className="absolute left-1 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft className="h-7 w-7" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next item"
                  className="absolute right-1 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight className="h-7 w-7" aria-hidden="true" />
                </button>
              </>
            )}

            {active.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImageUrl(active.url, 1800)}
                alt={active.caption?.trim() || 'Self drive rental photo'}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : (
              <video
                key={active.id}
                src={active.url}
                controls
                autoPlay
                playsInline
                className="max-h-full max-w-full rounded-lg bg-black"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          <p className="px-4 pb-5 text-center text-xs text-white/60">
            {activeIndex !== null && visible.length > 1
              ? `${activeIndex + 1} of ${visible.length}`
              : ''}
          </p>
        </div>
      )}
    </section>
  );
}
