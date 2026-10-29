import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { PoblacionNuevoContenido } from "@/components/poblaciones/poblacion-nuevo-contenido"
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
  title: "Nueva población",
}

function FormSkeleton() {
  return <Skeleton className="h-48 w-full" />
}

export default function NuevaPoblacionPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/poblaciones"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a población
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Nueva población</CardTitle>
          <CardDescription>
            Registra la población activa, pagada y certificada de una sede por
            asegurador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <PoblacionNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
