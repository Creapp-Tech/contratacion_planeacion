import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CATALOGOS, type CatalogoDominio } from "@/lib/catalogos/dominios"

import { CatalogoDetalleContenido } from "./catalogo-detalle-contenido"

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function CatalogoDetallePage({
  dominio,
  id,
}: {
  dominio: CatalogoDominio
  id: string
}) {
  const config = CATALOGOS[dominio]

  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href={config.ruta}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeftIcon />
        Volver a {config.titulo.toLowerCase()}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Detalle del {config.singular}
          </CardTitle>
          <CardAction>
            <Link
              href={`${config.ruta}/${id}/editar`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <PencilIcon />
              Editar
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DetalleSkeleton />}>
            <CatalogoDetalleContenido dominio={dominio} id={id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
