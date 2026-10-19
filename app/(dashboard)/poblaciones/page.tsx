import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { PoblacionesContenido } from "@/components/poblaciones/poblaciones-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUsuario } from "@/lib/auth/session"
import { puedeEditarPlaneacion } from "@/lib/constants/roles"

export const metadata: Metadata = {
  title: "Población",
}

function TablaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

async function BotonNuevaPoblacion() {
  const usuario = await getCurrentUsuario()

  if (!puedeEditarPlaneacion(usuario?.rol ?? "")) return null

  return (
    <Link href="/poblaciones/nuevo" className={cn(buttonVariants())}>
      <PlusIcon />
      Nueva población
    </Link>
  )
}

export default function PoblacionesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Población</h1>
          <p className="text-sm text-muted-foreground">
            Población activa, pagada y certificada por sede y asegurador.
          </p>
        </div>

        <Suspense fallback={null}>
          <BotonNuevaPoblacion />
        </Suspense>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <PoblacionesContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
