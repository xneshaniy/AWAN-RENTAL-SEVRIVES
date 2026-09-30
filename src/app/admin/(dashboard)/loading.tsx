/**
 * Segment-wide loading skeleton for every /admin page. Shows while the
 * protected server component tree is still rendering.
 */
export default function AdminLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading admin page"
    >
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
    </div>
  );
}
