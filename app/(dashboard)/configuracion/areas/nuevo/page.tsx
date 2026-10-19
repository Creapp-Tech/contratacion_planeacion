import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { AreaNuevoContenido } from "@/components/areas/area-nuevo-contenido"
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
  title: "Nueva área",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function NuevaAreaPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
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
          <CardTitle className="font-heading">Nueva área</CardTitle>
          <CardDescription>
            Registra una nueva área en el catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <AreaNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
