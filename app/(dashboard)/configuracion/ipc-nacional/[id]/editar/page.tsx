import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { IpcNacionalEditarContenido } from "@/components/ipc-nacional/ipc-nacional-editar-contenido"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Editar IPC nacional",
}

export default function EditarIpcNacionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/ipc-nacional"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a IPC Nacional
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Editar IPC nacional
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualiza el país, año, % IPC o los valores de UPC del registro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Datos del registro</CardTitle>
          <CardDescription>
            Los cambios se reflejan en el comparativo de Seguimiento IPC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-56 w-full" />}>
            <IpcNacionalEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
