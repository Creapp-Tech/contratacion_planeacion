import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CATALOGOS, type CatalogoDominio } from "@/lib/catalogos/dominios"

import { CatalogosContenido } from "./catalogos-contenido"

function TablaSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />
}

export function CatalogoListaPage({ dominio }: { dominio: CatalogoDominio }) {
  const config = CATALOGOS[dominio]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            {config.titulo}
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las opciones de {config.titulo.toLowerCase()} usadas en
            los formularios.
          </p>
        </div>

        <Link href={`${config.ruta}/nuevo`} className={cn(buttonVariants())}>
          <PlusIcon />
          Nuevo {config.singular}
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <CatalogosContenido config={config} />
      </Suspense>
    </div>
  )
}
