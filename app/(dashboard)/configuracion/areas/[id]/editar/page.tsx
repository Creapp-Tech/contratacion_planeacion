import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { AreaEditarContenido } from "@/components/areas/area-editar-contenido"
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
  title: "Editar área",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function EditarAreaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/areas"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a áreas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar área</CardTitle>
          <CardDescription>Actualiza el área del catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <AreaEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
