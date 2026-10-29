import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CATALOGOS, type CatalogoDominio } from "@/lib/catalogos/dominios"

import { CatalogoEditarContenido } from "./catalogo-editar-contenido"

function FormSkeleton() {
  return <Skeleton className="h-14 w-full" />
}

export function CatalogoEditarPage({
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
            Editar {config.singular}
          </CardTitle>
          <CardDescription>
            Actualiza los datos de {config.singular}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <CatalogoEditarContenido dominio={dominio} id={id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
