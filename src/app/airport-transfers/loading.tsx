import { Layout } from '@/components/layout/Layout';

const AIRPORT_SKELETONS = Array.from({ length: 3 });

/**
 * Shown while the airport-transfers route is being loaded client-side
 * (e.g. during navigation).
 */
export default function AirportTransfersLoading() {
  return (
    <Layout>
      <div role="status" aria-label="Loading airport transfers">
        <div
          className="py-16 sm:py-24 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900"
          aria-hidden="true"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="h-8 w-40 bg-white/20 rounded-full mx-auto" />
            <div className="h-12 w-full max-w-2xl bg-white/20 rounded-lg mx-auto" />
            <div className="h-5 w-full max-w-3xl bg-white/10 rounded-lg mx-auto" />
            <div className="flex gap-4 justify-center pt-2">
              <div className="h-12 w-52 bg-white/20 rounded-xl" />
              <div className="h-12 w-48 bg-white/20 rounded-xl" />
              <div className="h-12 w-40 bg-white/20 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
              <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
              <div className="h-5 w-full max-w-xl bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {AIRPORT_SKELETONS.map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse space-y-4"
                >
                  <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-2xl mx-auto" />
                  <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pb-16 sm:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-8 space-y-4">
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-11 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-11 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              </div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
