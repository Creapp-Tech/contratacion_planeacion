import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ContratoEditarContenido } from "@/components/contratos/contrato-editar-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  etiquetaVolverContratos,
  volverContratosDesde,
} from "@/lib/contratos/constantes"

export const instant = false

export const metadata: Metadata = {
  title: "Editar contrato",
}

export default async function EditarContratoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const volverA = volverContratosDesde((await searchParams).volver)

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href={volverA}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        {etiquetaVolverContratos(volverA)}
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Editar contrato
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualiza la información del contrato y su asignación.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ContratoEditarContenido params={params} volverA={volverA} />
      </Suspense>
    </div>
  )
}
