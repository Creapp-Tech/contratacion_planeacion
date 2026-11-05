import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CupsContenido } from "@/components/cups/usuarios-contenido"

export const metadata: Metadata = {
  title: "CUPS",
}

export default function CupsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">CUPS</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de Prestaciones de Salud.
          </p>
        </div>

        <Link href="/configuracion/cups/nuevo" className={cn(buttonVariants())}>
          <PlusIcon /> Nuevo CUPS
        </Link>
      </div>

      <Suspense fallback={<Skeleton />}>
        <CupsContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
