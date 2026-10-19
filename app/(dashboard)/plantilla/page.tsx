import type { Metadata } from "next"
import { Suspense } from "react"

import { PlantillaContenido } from "@/components/plantilla/plantilla-contenido"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Plantilla",
}

function TablaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function PlantillaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Plantilla</h1>
          <p className="text-sm text-muted-foreground">
            Módulo de ejemplo con tabla.
          </p>
        </div>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <PlantillaContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}