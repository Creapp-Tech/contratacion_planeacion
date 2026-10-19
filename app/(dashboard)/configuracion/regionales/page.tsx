import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { RegionalesContenido } from "@/components/regionales/regionales-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Regionales",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function ConfiguracionRegionalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Regionales</h1>
          <p className="text-sm text-muted-foreground">
            Administra las regionales del sistema.
          </p>
        </div>

        <Link
          href="/configuracion/regionales/nuevo"
          className={cn(buttonVariants())}
        >
          <PlusIcon />
          Nueva regional
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <RegionalesContenido />
      </Suspense>
    </div>
  )
}
