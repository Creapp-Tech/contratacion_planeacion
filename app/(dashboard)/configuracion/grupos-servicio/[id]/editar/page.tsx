import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { GrupoServicioEditarContenido } from "@/components/grupos-servicio/grupo-servicio-editar-contenido"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Editar grupo de servicio",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function EditarGrupoServicioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/grupos-servicio"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a grupos de servicio
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar grupo</CardTitle>
          <CardDescription>
            Actualiza el nombre del grupo en el catálogo de servicios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <GrupoServicioEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
