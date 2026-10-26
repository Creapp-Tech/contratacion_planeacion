import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { IpcNacionalContenido } from "@/components/ipc-nacional/ipc-nacional-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "IPC Nacional",
}

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export default function IpcNacionalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">IPC Nacional</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de % IPC y valores de UPC por país y año. Es la
            referencia del comparativo en Seguimiento IPC.
          </p>
        </div>

        <Link
          href="/configuracion/ipc-nacional/nuevo"
          className={cn(buttonVariants())}
        >
          <PlusIcon />
          Nuevo registro
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <IpcNacionalContenido />
      </Suspense>
    </div>
  )
}
