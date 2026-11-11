import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { ContratosContenido } from "@/components/contratos/contratos-contenido"
import { SoloEscritura } from "@/components/auth/permisos-provider"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Contratos internacionales",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function ContratosInternacionalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Contratos internacionales
          </h1>
          <p className="text-sm text-muted-foreground">
            Contratos en ejecución de países distintos a Colombia, asociados a
            aseguradores y regionales.
          </p>
        </div>

        <SoloEscritura>
          <Link
            href="/contratos/nuevo?ambito=internacional"
            className={cn(buttonVariants())}
          >
            <PlusIcon />
            Nuevo contrato internacional
          </Link>
        </SoloEscritura>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <ContratosContenido
          searchParams={searchParams}
          ambito="internacional"
        />
      </Suspense>
    </div>
  )
}
