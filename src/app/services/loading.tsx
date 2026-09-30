import { Layout } from '@/components/layout/Layout';

const CARD_SKELETONS = Array.from({ length: 6 });

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 sm:p-6 space-y-3">
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export default function ServicesLoading() {
  return (
    <Layout>
      <div role="status" aria-label="Loading services">
        <div
          className="py-16 sm:py-24 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900"
          aria-hidden="true"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="h-8 w-32 bg-white/20 rounded-full mx-auto" />
            <div className="h-12 w-full max-w-2xl bg-white/20 rounded-lg mx-auto" />
            <div className="h-5 w-full max-w-3xl bg-white/10 rounded-lg mx-auto" />
            <div className="flex gap-4 justify-center pt-2">
              <div className="h-12 w-40 bg-white/20 rounded-xl" />
              <div className="h-12 w-48 bg-white/20 rounded-xl" />
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
              {CARD_SKELETONS.map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
