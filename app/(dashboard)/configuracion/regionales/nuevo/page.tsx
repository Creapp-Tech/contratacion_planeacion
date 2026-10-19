import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { RegionalNuevoContenido } from "@/components/regionales/regional-nuevo-contenido"
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
  title: "Nueva regional",
}

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export default function NuevaRegionalPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
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
          <CardTitle className="font-heading">Nueva regional</CardTitle>
          <CardDescription>
            Registra una nueva regional en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <RegionalNuevoContenido />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
