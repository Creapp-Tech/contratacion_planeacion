import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ServicioNuevoContenido } from "@/components/servicios/servicio-nuevo-contenido"
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
  title: "Nuevo servicio",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function NuevoServicioPage() {
  return (
    <div className="flex w-full flex-col gap-6">
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
          <CardTitle className="font-heading">Nuevo servicio</CardTitle>
          <CardDescription>
            Registra un nuevo servicio en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <ServicioNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}