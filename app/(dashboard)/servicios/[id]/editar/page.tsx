import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ServicioEditarContenido } from "@/components/servicios/servicio-editar-contenido"
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
  title: "Editar servicio",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Link
        href="/servicios"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a servicios
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar servicio</CardTitle>
          <CardDescription>Actualiza los datos del servicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <ServicioEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}