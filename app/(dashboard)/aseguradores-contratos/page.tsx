import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { AseguradoresContratosContenido } from "@/components/aseguradores-contratos/contenido"
import { SoloEscritura } from "@/components/auth/permisos-provider"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"

export const metadata: Metadata = {
  title: "Aseguradores y Contratos",
}

function ContenidoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

export default function AseguradoresContratosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Aseguradores y Contratos
          </h1>
          <p className="text-sm text-muted-foreground">
            Servicios CUPS contratados por asegurador, con frecuencia de uso y
            CME por contrato.
          </p>
        </div>
        <SoloEscritura>
          <Link
            href={`${RUTA}/nuevo`}
            className={cn(buttonVariants())}
          >
            <PlusIcon />
            Nuevo servicio CUPS
          </Link>
        </SoloEscritura>
      </div>

      <Suspense fallback={<ContenidoSkeleton />}>
        <AseguradoresContratosContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
