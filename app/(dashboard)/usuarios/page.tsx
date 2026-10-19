import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { UsuariosContenido } from "@/components/usuarios/usuarios-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Usuarios",
}

function TablaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios del sistema y sus roles.
          </p>
        </div>

        <Link
          href="/usuarios/nuevo"
          className={cn(buttonVariants())}
        >
          <PlusIcon />
          Nuevo usuario
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <UsuariosContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}