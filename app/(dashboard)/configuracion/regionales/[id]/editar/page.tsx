import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { RegionalEditarContenido } from "@/components/regionales/regional-editar-contenido"
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
  title: "Editar regional",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function EditarRegionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/regionales"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a regionales
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar regional</CardTitle>
          <CardDescription>
            Actualiza el nombre de la regional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <RegionalEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
