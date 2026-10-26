import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ContratoNuevoContenido } from "@/components/contratos/contrato-nuevo-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Nuevo contrato",
}

export default function NuevoContratoPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/contratos"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a contratos
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">Nuevo contrato</h1>
        <p className="text-sm text-muted-foreground">
          Registra un contrato y asígnalo a un asegurador, regional y
          responsable.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ContratoNuevoContenido />
      </Suspense>
    </div>
  )
}
