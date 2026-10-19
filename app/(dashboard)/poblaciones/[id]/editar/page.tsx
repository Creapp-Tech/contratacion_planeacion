import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { PoblacionEditarContenido } from "@/components/poblaciones/poblacion-editar-contenido"
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
  title: "Editar población",
}

function FormSkeleton() {
  return <Skeleton className="h-48 w-full" />
}

export default function EditarPoblacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
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
          <CardTitle className="font-heading">Editar población</CardTitle>
          <CardDescription>
            Actualiza la sede, el asegurador o los valores de población.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <PoblacionEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
