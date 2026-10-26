import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { IpcEditarContenido } from "@/components/ipc/ipc-editar-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Editar registro IPC",
}

export default function EditarIpcPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
          Editar registro IPC
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualiza el contrato, año, costo usuario, UPC o % IPC del registro.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <IpcEditarContenido params={params} />
      </Suspense>
    </div>
  )
}
