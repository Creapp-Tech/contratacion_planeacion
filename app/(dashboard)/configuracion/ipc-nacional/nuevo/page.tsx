import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { IpcNacionalNuevoContenido } from "@/components/ipc-nacional/ipc-nacional-nuevo-contenido"
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
  title: "Nuevo IPC nacional",
}

export default function NuevoIpcNacionalPage() {
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
          Nuevo IPC nacional
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra el % IPC y los valores de UPC (contributivo y subsidiado) de
          un país para un año.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Datos del registro</CardTitle>
          <CardDescription>
            Solo puede existir un registro por país y año.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-56 w-full" />}>
            <IpcNacionalNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
