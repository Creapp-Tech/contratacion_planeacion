import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"

import { PoblacionDetalleContenido } from "@/components/poblaciones/poblacion-detalle-contenido"
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
  title: "Detalle de población",
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}

export default function PoblacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/poblaciones"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver a población
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Detalle de la población</CardTitle>
          <CardAction>
            <Suspense fallback={null}>
              <EditarLink params={params} />
            </Suspense>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DetalleSkeleton />}>
            <PoblacionDetalleContenido params={params} />
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
      href={`/poblaciones/${id}/editar`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <PencilIcon />
      Editar
    </Link>
  )
}
