import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { EspecialistaForm } from "@/components/direccionamiento/especialista-form"
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
import { puedeEditarRegistroDireccionamiento } from "@/lib/direccionamiento/permisos"
import {
  getEspecialista,
  listOpcionesDireccionamiento,
  regionalesEspecialista,
} from "@/lib/direccionamiento/queries"

export const metadata: Metadata = {
  title: "Editar especialista",
}

type EditarPageProps = {
  params: Promise<{ id: string }>
}

function FormularioSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}

/** Params, sesión y datos se resuelven dentro del límite de Suspense. */
async function EditarContenido({ params }: EditarPageProps) {
  const { id } = await params
  const usuario = await requireEditorDireccionamiento()
  const [especialista, opciones, alcance, regionales] = await Promise.all([
    getEspecialista(id),
    listOpcionesDireccionamiento(),
    alcanceDelUsuario(usuario),
    regionalesEspecialista(id),
  ])

  if (!especialista) notFound()
  if (
    !puedeEditarRegistroDireccionamiento(
      usuario.rol,
      alcance.regional,
      regionales,
      especialista.created_by,
      usuario.id
    )
  ) {
    redirect("/direccionamiento")
  }

  return (
    <>
      <Link
        href={`/direccionamiento/${id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver a la ficha del especialista
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar especialista</CardTitle>
          <CardDescription>
            Actualiza la identificación, clasificación y ubicación. El historial
            conserva todos los cambios anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EspecialistaForm
            mode="editar"
            especialista={especialista}
            opciones={opciones}
          />
        </CardContent>
      </Card>
    </>
  )
}

export default function EditarEspecialistaPage(props: EditarPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<FormularioSkeleton />}>
        <EditarContenido {...props} />
      </Suspense>
    </div>
  )
}
