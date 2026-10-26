import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ContratosContenido } from "@/components/contratos/contratos-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Historial de contratos",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Historial</h1>
          <p className="text-sm text-muted-foreground">
            Contratos finalizados o que no están en ejecución.
          </p>
        </div>

        <Link
          href="/contratos"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeftIcon />
          Contratos en ejecución
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <ContratosContenido searchParams={searchParams} vista="historial" />
      </Suspense>
    </div>
  )
}
