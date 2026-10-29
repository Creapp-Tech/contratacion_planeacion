import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ContratoNuevoDocumentoContenido } from "@/components/contratos/contrato-nuevo-documento-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const instant = false

export const metadata: Metadata = {
  title: "Nuevo documento del contrato",
}

export default async function NuevoDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href={`/contratos/${id}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver al contrato
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Nuevo documento
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra un modificatorio, otro sí o anexo asociado al contrato.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ContratoNuevoDocumentoContenido params={params} />
      </Suspense>
    </div>
  )
}