import type { Metadata } from "next"
import { Suspense } from "react"

import { CapacidadContenido } from "@/components/capacidad-instalada/capacidad-contenido"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Análisis de capacidad instalada",
}

function ContenidoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}

export default function CapacidadInstaladaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Análisis de capacidad instalada
        </h1>
        <p className="text-sm text-muted-foreground">
          Ocupación de las sedes según la capacidad instalada y la población
          asignada.
        </p>
      </div>

      <Suspense fallback={<ContenidoSkeleton />}>
        <CapacidadContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
