import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"

import { UsuarioDetalleContenido } from "@/components/usuarios/usuario-detalle-contenido"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Detalle de usuario",
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}

export default function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/usuarios"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver a usuarios
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Detalle del usuario</CardTitle>
          <CardAction>
            <DetalleAcciones params={params} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DetalleSkeleton />}>
            <UsuarioDetalleContenido params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function DetalleAcciones({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <EditarLink params={params} />
    </Suspense>
  )
}

async function EditarLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Link
      href={`/usuarios/${id}/editar`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <PencilIcon />
      Editar
    </Link>
  )
}
