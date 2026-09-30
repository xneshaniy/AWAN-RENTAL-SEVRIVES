import { Layout } from '@/components/layout/Layout';

const CARD_SKELETONS = Array.from({ length: 8 });

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-56 sm:h-64 bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex gap-3 pt-2">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function VehiclesLoading() {
  return (
    <Layout>
      <div className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50" role="status" aria-label="Loading vehicles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="h-10 w-72 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
            <div className="h-5 w-full max-w-xl bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {CARD_SKELETONS.map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
