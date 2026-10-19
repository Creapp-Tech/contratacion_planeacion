import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { AseguradorEditarContenido } from "@/components/aseguradores/asegurador-editar-contenido"
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
  title: "Editar asegurador",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function EditarAseguradorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
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
          <CardTitle className="font-heading">Editar asegurador</CardTitle>
          <CardDescription>
            Actualiza el nombre del asegurador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <AseguradorEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
