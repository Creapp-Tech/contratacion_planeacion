import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { FrecuenciaEditarContenido } from "@/components/frecuencias/frecuencia-editar-contenido"
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
  title: "Editar frecuencia",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function EditarFrecuenciaPage({
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
          <CardTitle className="font-heading">Editar frecuencia</CardTitle>
          <CardDescription>
            Actualiza el encabezado y los servicios de la frecuencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <FrecuenciaEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}