import type { Metadata } from "next"
import Link from "next/link"
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
import { requireEditorDireccionamiento } from "@/lib/auth/session"
import { listOpcionesDireccionamiento } from "@/lib/direccionamiento/queries"

export const metadata: Metadata = {
  title: "Nuevo especialista",
}

function FormularioSkeleton() {
  return (
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
  )
}

/** La sesión y las opciones se leen dentro del límite de Suspense de la página. */
async function NuevoEspecialistaContenido() {
  await requireEditorDireccionamiento()
  const opciones = await listOpcionesDireccionamiento()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Nuevo especialista</CardTitle>
        <CardDescription>
          Registra el especialista. Después podrás agregar sus contratos,
          servicios CUPS y la asignación independiente de sedes desde su
          ficha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EspecialistaForm mode="crear" opciones={opciones} />
      </CardContent>
    </Card>
  )
}

export default function NuevoEspecialistaPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/direccionamiento"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver a direccionamiento
      </Link>

      <Suspense fallback={<FormularioSkeleton />}>
        <NuevoEspecialistaContenido />
      </Suspense>
    </div>
  )
}
