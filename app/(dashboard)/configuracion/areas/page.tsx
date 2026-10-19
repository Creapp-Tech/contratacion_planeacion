import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { AreasContenido } from "@/components/areas/areas-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Áreas" }

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function AreasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Áreas</h1>
          <p className="text-sm text-muted-foreground">
            Administra el catálogo de áreas.
          </p>
        </div>
        <Link href="/configuracion/areas/nuevo" className={cn(buttonVariants())}>
          <PlusIcon /> Nueva área
        </Link>
      </div>
      <Suspense fallback={<TablaSkeleton />}>
        <AreasContenido />
      </Suspense>
    </div>
  )
}
