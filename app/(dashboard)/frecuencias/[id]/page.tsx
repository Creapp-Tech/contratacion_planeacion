import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, DownloadIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"

import { FrecuenciaDetalleContenido } from "@/components/frecuencias/frecuencia-detalle-contenido"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Detalle de frecuencia",
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function FrecuenciaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/frecuencias"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a frecuencias de uso
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Detalle de frecuencia</CardTitle>
          <CardAction>
            <Suspense fallback={null}>
              <div className="flex items-center gap-2">
                <DescargarServiciosLink params={params} />
                <EditarLink params={params} />
              </div>
            </Suspense>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DetalleSkeleton />}>
            <FrecuenciaDetalleContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function EditarLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <Link
      href={`/frecuencias/${id}/editar`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <PencilIcon />
      Editar
    </Link>
  )
}

async function DescargarServiciosLink({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <a
      href={`/frecuencias/${id}/servicios`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <DownloadIcon />
      Descargar servicios
    </a>
  )
}