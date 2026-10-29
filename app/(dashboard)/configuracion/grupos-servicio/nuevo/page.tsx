import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { GrupoServicioNuevoContenido } from "@/components/grupos-servicio/grupo-servicio-nuevo-contenido"
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
  title: "Nuevo grupo de servicio",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function NuevoGrupoServicioPage() {
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
          <CardTitle className="font-heading">Nuevo grupo</CardTitle>
          <CardDescription>
            Registra un nuevo grupo en el catálogo de servicios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <GrupoServicioNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
