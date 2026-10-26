import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { GruposServicioContenido } from "@/components/grupos-servicio/grupos-servicio-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Grupos de servicio" }

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function GruposServicioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Grupos de servicio
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra el catálogo de grupos de los servicios.
          </p>
        </div>
        <Link
          href="/configuracion/grupos-servicio/nuevo"
          className={cn(buttonVariants())}
        >
          <PlusIcon /> Nuevo grupo
        </Link>
      </div>
      <Suspense fallback={<TablaSkeleton />}>
        <GruposServicioContenido />
      </Suspense>
    </div>
  )
}
