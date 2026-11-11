import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { ContratoNuevoContenido } from "@/components/contratos/contrato-nuevo-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RUTAS_CONTRATOS,
  type AmbitoContratos,
} from "@/lib/contratos/constantes"

export const metadata: Metadata = {
  title: "Nuevo contrato",
}

// La página decide el ámbito leyendo searchParams; se marca como bloqueante
// para que Next no intente prerenderizarla sin acceso a la URL.
export const instant = false

function ambitoDesde(value: string | string[] | undefined): AmbitoContratos {
  return value === "internacional" ? "internacional" : "nacional"
}

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const ambito = ambitoDesde((await searchParams).ambito)
  const volverA = RUTAS_CONTRATOS[ambito]
  const internacional = ambito === "internacional"

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href={volverA}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        {internacional
          ? "Volver a contratos internacionales"
          : "Volver a contratos nacionales"}
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {internacional ? "Nuevo contrato internacional" : "Nuevo contrato nacional"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra un contrato y asígnalo a un asegurador, país, regional y
          responsable.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ContratoNuevoContenido ambito={ambito} />
      </Suspense>
    </div>
  )
}
