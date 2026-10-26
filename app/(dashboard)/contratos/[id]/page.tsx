import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"

import { ContratoDetalleContenido } from "@/components/contratos/contrato-detalle-contenido"
import { DuplicarContratoBoton } from "@/components/contratos/duplicar-contrato"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Detalle de contrato",
}

function volverDesde(value: string | string[] | undefined) {
  return value === "/historial" ? "/historial" : "/contratos"
}

export default async function ContratoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const volverA = volverDesde((await searchParams).volver)

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
        {volverA === "/historial" ? "Volver al historial" : "Volver a contratos"}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Detalle del contrato
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta la información registrada del contrato.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DuplicarLink params={params} volverA={volverA} />
          <EditarLink params={params} volverA={volverA} />
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ContratoDetalleContenido params={params} />
      </Suspense>
    </div>
  )
}

async function DuplicarLink({
  params,
  volverA,
}: {
  params: Promise<{ id: string }>
  volverA: string
}) {
  const { id } = await params

  return (
    <DuplicarContratoBoton
      id={id}
      variant="outline"
      size="sm"
      volverA={volverA}
      showLabel
    />
  )
}

async function EditarLink({
  params,
  volverA,
}: {
  params: Promise<{ id: string }>
  volverA: string
}) {
  const { id } = await params
  const href =
    volverA === "/historial"
      ? `/contratos/${id}/editar?volver=${encodeURIComponent(volverA)}`
      : `/contratos/${id}/editar`

  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <PencilIcon />
      Editar
    </Link>
  )
}
