import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardContratosLoading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-24 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}
