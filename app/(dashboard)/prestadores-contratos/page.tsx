import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { SoloEscritura } from "@/components/auth/permisos-provider"
import { PrestadoresContratosContenido } from "@/components/prestadores-contratos/prestadores-contratos-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Prestadores y contratos",
}

function ContenidoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

export default function PrestadoresContratosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">PrestadoresContratos</h1>
          <p className="text-sm text-muted-foreground">
            Especialistas, aseguradores, contratos, servicios CUPS y su
            asignación independiente por sede.
          </p>
        </div>
        <SoloEscritura>
          <Link
            href="/prestadores-contratos/nuevo"
            className={cn(buttonVariants())}
          >
            <PlusIcon />
            Nuevo especialista
          </Link>
        </SoloEscritura>
      </div>

      <Suspense fallback={<ContenidoSkeleton />}>
        <PrestadoresContratosContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
