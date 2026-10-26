import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { IpcNuevoContenido } from "@/components/ipc/ipc-nuevo-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Nuevo registro IPC",
}

export default function NuevoIpcPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/ipc"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a Seguimiento IPC
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Nuevo registro IPC
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra el costo usuario, las UPC y el % IPC de un contrato para un
          año. Los contratos en ejecución se muestran primero; los contratos
          fuera de ejecución aparecen resaltados en naranja.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <IpcNuevoContenido />
      </Suspense>
    </div>
  )
}
