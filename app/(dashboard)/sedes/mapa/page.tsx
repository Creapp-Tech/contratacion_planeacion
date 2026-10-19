import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { UsersIcon } from "lucide-react"
import { cn } from "cn"

import { SedesMapaContenido } from "@/components/sedes/mapa/sedes-mapa-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Mapa de sedes",
}

function MapaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[520px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}

export default function SedesMapaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mapa de sedes</h1>
          <p className="text-sm text-muted-foreground">
            Ubicación y ocupación de las sedes según la población asignada.
          </p>
        </div>

        <Link
          href="/poblaciones"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <UsersIcon />
          Gestionar poblaciones
        </Link>
      </div>

      <Suspense fallback={<MapaSkeleton />}>
        <SedesMapaContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
