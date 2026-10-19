import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"

import { SedesContenido } from "@/components/sedes/sedes-contenido"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Sedes",
}

function TablaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function SedesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sedes</h1>
          <p className="text-sm text-muted-foreground">
            Administra las sedes de la organización.
          </p>
        </div>

        <Link href="/sedes/nuevo" className={cn(buttonVariants())}>
          <PlusIcon />
          Nueva sede
        </Link>
      </div>

      <Suspense fallback={<TablaSkeleton />}>
        <SedesContenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
