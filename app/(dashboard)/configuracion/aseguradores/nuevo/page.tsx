import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { AseguradorNuevoContenido } from "@/components/aseguradores/asegurador-nuevo-contenido"
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
  title: "Nuevo asegurador",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function NuevoAseguradorPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/aseguradores"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a aseguradores
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Nuevo asegurador</CardTitle>
          <CardDescription>
            Registra un nuevo asegurador EPS en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <AseguradorNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
