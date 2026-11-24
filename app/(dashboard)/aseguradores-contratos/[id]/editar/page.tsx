import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ServicioCupsForm } from "@/components/aseguradores-contratos/servicio-cups-form"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  alcanceDelUsuario,
  requireEditorDireccionamiento,
} from "@/lib/auth/session"
import { RUTA } from "@/lib/aseguradores-contratos/constantes"
import { puedeEditarServicioAsegurador } from "@/lib/aseguradores-contratos/permisos"
import {
  getServicioCups,
  listOpcionesAseguradoresContratos,
  regionalesDelContrato,
} from "@/lib/aseguradores-contratos/queries"

export const metadata: Metadata = {
  title: "Editar servicio CUPS",
}

type EditarPageProps = {
  params: Promise<{ id: string }>
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

/** Params, sesión y datos se resuelven dentro del límite de Suspense. */
async function EditarContenido({ params }: EditarPageProps) {
  const { id } = await params
  const usuario = await requireEditorDireccionamiento()
  const [servicio, opciones, alcance] = await Promise.all([
    getServicioCups(id),
    listOpcionesAseguradoresContratos(),
    alcanceDelUsuario(usuario),
  ])

  if (!servicio) notFound()

  const regionales = await regionalesDelContrato(servicio.contrato_id)
  if (
    !puedeEditarServicioAsegurador(
      usuario.rol,
      alcance.regional,
      regionales,
      servicio.created_by,
      usuario.id
    )
  ) {
    redirect(RUTA)
  }

  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar servicio CUPS</CardTitle>
          <CardDescription>
            Actualiza el CUPS, la frecuencia, el CME y las opciones de
            direccionamiento. El historial conserva los cambios anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicioCupsForm opciones={opciones} servicio={servicio} />
        </CardContent>
      </Card>
    </>
  )
}

export default function EditarServicioCupsPage(props: EditarPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<FormularioSkeleton />}>
        <EditarContenido {...props} />
      </Suspense>
    </div>
  )
}
