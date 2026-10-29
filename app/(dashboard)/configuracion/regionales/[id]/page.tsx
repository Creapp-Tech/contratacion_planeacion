import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"

import { RegionalDetalleContenido } from "@/components/regionales/regional-detalle-contenido"
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
  title: "Detalle de regional",
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function RegionalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/regionales"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a regionales
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Detalle de la regional</CardTitle>
          <CardAction>
            <Suspense fallback={null}>
              <EditarLink params={params} />
            </Suspense>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DetalleSkeleton />}>
            <RegionalDetalleContenido params={params} />
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
      href={`/configuracion/regionales/${id}/editar`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <PencilIcon />
      Editar
    </Link>
  )
}
