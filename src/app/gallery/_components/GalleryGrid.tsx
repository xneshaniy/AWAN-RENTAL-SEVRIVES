'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Film, Play, X } from 'lucide-react';
import { GALLERY_CATEGORY_LABELS, type GalleryCategory } from '@/types';

/**
 * The gallery's whole payload: every photo and clip on one vehicle, flattened
 * from the page server component. Videos are plain URLs - the tile never loads
 * a `<video>` element until the visitor actually opens it, so a fleet of clips
 * costs nothing on first paint.
 */
export interface GalleryVehicle {
  id: string;
  name: string;
  slug: string;
  photos: Array<{ url: string; category: GalleryCategory }>;
  videos: string[];
}

interface MediaItem {
  key: string;
  type: 'photo' | 'video';
  url: string;
  vehicleId: string;
  vehicleName: string;
  vehicleSlug: string;
  label: string;
}

type KindFilter = 'all' | 'photos' | 'videos';

const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'photos', label: 'Photos' },
  { value: 'videos', label: 'Videos' },
];

/** Grid densities used for the `sizes` hint, so phones never download 4K tiles. */
const TILE_SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

export function GalleryGrid({ vehicles }: { vehicles: GalleryVehicle[] }) {
  const [kind, setKind] = useState<KindFilter>('all');
  const [vehicleId, setVehicleId] = useState<string>('all');
  /** Index into the filtered list, not the full list - prev/next stay in view. */
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Photos first, then clips, so the ordering never changes while filtering.
  const allItems = useMemo<MediaItem[]>(
    () =>
      vehicles.flatMap((vehicle) => [
        ...vehicle.photos.map((photo, index) => ({
          key: `${vehicle.id}-photo-${index}`,
          type: 'photo' as const,
          url: photo.url,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehicleSlug: vehicle.slug,
          label: `${vehicle.name} - ${GALLERY_CATEGORY_LABELS[photo.category] ?? 'Exterior'}`,
        })),
        ...vehicle.videos.map((url, index) => ({
          key: `${vehicle.id}-video-${index}`,
          type: 'video' as const,
          url,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehicleSlug: vehicle.slug,
          label: `${vehicle.name} - video`,
        })),
      ]),
    [vehicles]
  );

  const visible = useMemo(
    () =>
      allItems.filter(
        (item) =>
          (kind === 'all' || item.type === (kind === 'photos' ? 'photo' : 'video')) &&
          (vehicleId === 'all' || item.vehicleId === vehicleId)
      ),
    [allItems, kind, vehicleId]
  );

  // Only vehicles that actually contribute to the current view get a pill.
  const vehicleOptions = useMemo(() => {
    const ids = new Set(
      allItems
        .filter((item) => kind === 'all' || item.type === (kind === 'photos' ? 'photo' : 'video'))
        .map((item) => item.vehicleId)
    );
    return vehicles.filter((vehicle) => ids.has(vehicle.id));
  }, [allItems, vehicles, kind]);

  // Leaving a filter that empties the list must not strand a stale index.
  useEffect(() => {
    setActiveIndex(null);
  }, [kind, vehicleId]);

  const active = activeIndex === null ? null : visible[activeIndex] ?? null;

  // Lock the page behind the overlay while it is open.
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

  return (
    <div className="space-y-6">
      {/* Media type */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter gallery by media type"
      >
        {KIND_OPTIONS.map((option) => {
          const selected = kind === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={selected}
              className={
                selected
                  ? 'rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white'
                  : 'rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300'
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* One pill per vehicle that has media of the selected kind */}
      {vehicleOptions.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter gallery by vehicle"
        >
          <button
            type="button"
            onClick={() => setVehicleId('all')}
            aria-pressed={vehicleId === 'all'}
            className={
              vehicleId === 'all'
                ? 'rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900'
                : 'rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300'
            }
          >
            All vehicles
          </button>
          {vehicleOptions.map((vehicle) => {
            const selected = vehicleId === vehicle.id;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setVehicleId(vehicle.id)}
                aria-pressed={selected}
                className={
                  selected
                    ? 'rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900'
                    : 'rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-300'
                }
              >
                {vehicle.name}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Nothing to show here yet
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {kind === 'videos'
              ? 'No videos have been uploaded for this selection yet.'
              : 'No photos match this selection yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block overflow-hidden rounded-2xl bg-gray-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-gray-800"
              aria-label={`Open ${item.label}`}
            >
              <span className="relative block aspect-video w-full">
                {item.type === 'photo' ? (
                  <Image
                    src={item.url}
                    alt={item.label}
                    fill
                    sizes={TILE_SIZES}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gray-900">
                    <Film className="h-8 w-8 text-gray-500" aria-hidden="true" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                )}
              </span>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                <span className="block truncate text-xs font-medium text-white">
                  {item.vehicleName}
                </span>
                <span className="block truncate text-[11px] text-white/75">
                  {item.type === 'video' ? 'Video' : item.label.split(' - ')[1]}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.label}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{active.vehicleName}</p>
              <p className="truncate text-xs text-gray-400">{active.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close"
              className="rounded-full p-2 text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
            {visible.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous"
                  className="absolute left-1 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-3"
                >
                  <ChevronLeft className="h-7 w-7" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next"
                  className="absolute right-1 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-3"
                >
                  <ChevronRight className="h-7 w-7" aria-hidden="true" />
                </button>
              </>
            )}

            {active.type === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.url}
                alt={active.label}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : (
              <video
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

          <div className="flex items-center justify-center gap-4 px-4 pb-5">
            <p className="text-xs text-gray-400">
              {activeIndex !== null && visible.length > 1
                ? `${activeIndex + 1} of ${visible.length}`
                : ''}
            </p>
            <Link
              href={`/vehicles/${active.vehicleSlug}`}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-200"
            >
              View vehicle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
