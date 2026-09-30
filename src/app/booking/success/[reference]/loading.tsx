/**
 * Loading state for /booking/success/[reference] — shown while the receipt is
 * being fetched from the database. Mirrors the receipt layout so there is no
 * layout shift when the data arrives.
 */
export default function BookingSuccessLoading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-4 py-12"
      role="status"
      aria-live="polite"
      aria-label="Loading your booking confirmation"
    >
      <div className="w-full max-w-2xl">
        <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto mb-3 h-7 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto mb-8 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />

          <div className="mb-8 space-y-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700 sm:text-right" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700 sm:w-56" />
            <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-700 sm:w-44" />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading your booking confirmation…
        </p>
      </div>
    </div>
  );
}
