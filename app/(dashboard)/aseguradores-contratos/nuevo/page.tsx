import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { NuevoServicioContenido } from "@/components/aseguradores-contratos/nuevo-contenido"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { requireEditorPrestadoresContratos } from "@/lib/auth/session"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import { listOpcionesAseguradoresContratos } from "@/lib/aseguradores-contratos/queries"

export const metadata: Metadata = {
  title: "Nuevo servicio CUPS",
}

function FormularioSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  )
}

/** La sesión y las opciones se leen dentro del límite de Suspense de la página. */
async function ContenidoNuevoServicio() {
  await requireEditorPrestadoresContratos()
  const opciones = await listOpcionesAseguradoresContratos()

  return <NuevoServicioContenido opciones={opciones} />
}

export default function NuevoServicioCupsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href={RUTA}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a aseguradores y contratos
      </Link>

      <Suspense fallback={<FormularioSkeleton />}>
        <ContenidoNuevoServicio />
      </Suspense>
    </div>
  )
}
