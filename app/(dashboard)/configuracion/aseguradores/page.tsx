import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { AseguradoresContenido } from "@/components/aseguradores/aseguradores-contenido"
import { SoloEscritura } from "@/components/auth/permisos-provider"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Aseguradores",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function AseguradoresPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Aseguradores</h1>
          <p className="text-sm text-muted-foreground">
            Administra los aseguradores EPS usados en los formularios.
          </p>
        </div>

        <SoloEscritura>
          <Link
            href="/configuracion/aseguradores/nuevo"
            className={cn(buttonVariants())}
          >
            <PlusIcon />
            Nuevo asegurador
          </Link>
        </SoloEscritura>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <AseguradoresContenido />
      </Suspense>
    </div>
  )
}
