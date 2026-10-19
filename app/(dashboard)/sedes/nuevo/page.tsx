import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { SedeNuevoContenido } from "@/components/sedes/sede-nuevo-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Nueva sede",
}

function FormSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-48 w-full rounded-2xl" />
      ))}
    </div>
  )
}

export default function NuevaSedePage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Nueva sede</h1>
          <p className="text-sm text-muted-foreground">
            Registra una nueva sede con su ubicación, capacidad y áreas.
          </p>
        </div>

        <Link
          href="/sedes"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeftIcon />
          Volver a sedes
        </Link>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <SedeNuevoContenido />
      </Suspense>
    </div>
  )
}
