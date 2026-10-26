import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { IpcContenido } from "@/components/ipc/ipc-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Seguimiento IPC",
}

function ContenidoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function IpcPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Seguimiento IPC
          </h1>
          <p className="text-sm text-muted-foreground">
            Costo usuario, UPC y % IPC anual por contrato, comparado con el IPC
            nacional.
          </p>
        </div>

        <Link href="/ipc/nuevo" className={cn(buttonVariants())}>
          <PlusIcon />
          Nuevo registro
        </Link>
      </div>

      <Suspense fallback={<ContenidoSkeleton />}>
        <IpcContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
