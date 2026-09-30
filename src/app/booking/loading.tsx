import { Layout } from '@/components/layout/Layout';

const FEATURED_SKELETONS = Array.from({ length: 6 });

/**
 * Shown while the booking route is being loaded client-side
 * (e.g. during navigation).
 */
export default function BookingLoading() {
  return (
    <Layout>
      <div role="status" aria-label="Loading booking page">
        <div
          className="py-16 sm:py-24 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900"
          aria-hidden="true"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 text-center lg:text-left">
              <div className="h-8 w-36 bg-white/20 rounded-full mx-auto lg:mx-0" />
              <div className="h-12 w-full max-w-md bg-white/20 rounded-lg mx-auto lg:mx-0" />
              <div className="h-5 w-full max-w-lg bg-white/10 rounded-lg mx-auto lg:mx-0" />
              <div className="flex gap-4 justify-center lg:justify-start pt-2">
                <div className="h-12 w-36 bg-white/20 rounded-xl" />
                <div className="h-12 w-36 bg-white/20 rounded-xl" />
                <div className="h-12 w-36 bg-white/20 rounded-xl" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 space-y-4">
              <div className="h-7 w-44 bg-white/20 rounded mx-auto animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-11 bg-white/10 rounded-xl animate-pulse" />
                <div className="h-11 bg-white/10 rounded-xl animate-pulse" />
                <div className="h-11 bg-white/10 rounded-xl animate-pulse" />
                <div className="h-11 bg-white/10 rounded-xl animate-pulse" />
              </div>
              <div className="h-11 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-11 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-12 bg-white/20 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        <div className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
              <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
              <div className="h-5 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_SKELETONS.map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
