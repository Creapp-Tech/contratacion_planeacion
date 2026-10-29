import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { FrecuenciaNuevoContenido } from "@/components/frecuencias/frecuencia-nuevo-contenido"
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
  title: "Nueva frecuencia",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function NuevaFrecuenciaPage() {
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
          <CardTitle className="font-heading">Nueva frecuencia</CardTitle>
          <CardDescription>
            Registra una nueva frecuencia de uso por servicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <FrecuenciaNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}