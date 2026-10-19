import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { ServiciosContenido } from "@/components/servicios/servicios-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Servicios",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function ServiciosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Servicios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los servicios ofrecidos.
          </p>
        </div>

        <Link href="/servicios/nuevo" className={cn(buttonVariants())}>
          <PlusIcon />
          Nuevo servicio
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <ServiciosContenido />
      </Suspense>
    </div>
  )
}