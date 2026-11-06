import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { CupEditarContenido } from "@/components/cups/cup-editar-contenido"
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
  title: "Editar CUPS",
}

export default function EditarCupsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/configuracion/cups"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a CUPS
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Editar CUPS</CardTitle>
          <CardDescription>Actualiza los datos del CUPS.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-14 w-full" />}>
            <CupEditarContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
