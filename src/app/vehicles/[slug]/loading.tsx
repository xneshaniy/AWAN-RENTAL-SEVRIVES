import { Layout } from '@/components/layout/Layout';

function Block({ className }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className || ''}`} />;
}

export default function VehicleDetailLoading() {
  return (
    <Layout>
      <div className="py-12 sm:py-16" role="status" aria-label="Loading vehicle details">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <Block className="h-4 w-12" />
            <Block className="h-4 w-4" />
            <Block className="h-4 w-16" />
            <Block className="h-4 w-4" />
            <Block className="h-4 w-32" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Block className="aspect-[4/3] w-full !rounded-2xl" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Block key={index} className="w-24 h-16" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3"
                  >
                    <Block className="h-5 w-32" />
                    <Block className="h-10 w-full" />
                    <Block className="h-10 w-full" />
                    <Block className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <Block className="h-7 w-56" />
                <Block className="h-4 w-full" />
                <Block className="h-4 w-full" />
                <Block className="h-4 w-3/4" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
                <div className="flex gap-2">
                  <Block className="h-6 w-24" />
                  <Block className="h-6 w-24" />
                </div>
                <Block className="h-8 w-3/4" />
                <Block className="h-4 w-1/2" />
                <Block className="h-12 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Block key={index} className="h-16" />
                  ))}
                </div>
                <Block className="h-12 w-full" />
                <Block className="h-12 w-full" />
                <Block className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
