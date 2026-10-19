import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { FrecuenciasContenido } from "@/components/frecuencias/frecuencias-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Frecuencias de uso",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function FrecuenciasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Frecuencias de uso
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las frecuencias de uso por servicio.
          </p>
        </div>

        <Link href="/frecuencias/nuevo" className={cn(buttonVariants())}>
          <PlusIcon />
          Nueva frecuencia
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <FrecuenciasContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}