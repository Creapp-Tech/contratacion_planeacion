import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { CargueMasivoContenido } from "@/components/contratos/cargue-masivo-contenido"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Cargue masivo de contratos",
}

export default async function CargueMasivoPage() {
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
        <h1 className="font-heading text-2xl font-semibold">Cargue masivo</h1>
        <p className="text-sm text-muted-foreground">
          Descarga la plantilla, completa los datos y súbela para crear contratos en bloque.
        </p>
      </div>
      <CargueMasivoContenido />
    </div>
  )
}