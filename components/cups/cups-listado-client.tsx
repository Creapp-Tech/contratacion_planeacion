"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import type {
  CupsRow,
  GrupoServicioOption,
  ServicioOption,
} from "@/lib/cups/queries"

import { CupsPaginacion } from "./cups-paginacion"
import { CupsTabla } from "./cups-tabla"

type CupsListadoClientProps = {
  cups: CupsRow[]
  total: number
  page: number
  pageSize: number
  filtrado?: boolean
  grupos: GrupoServicioOption[]
  servicios: ServicioOption[]
  puedeEditar: boolean
}

export function CupsListadoClient({
  cups,
  total,
  page,
  pageSize,
  filtrado = false,
  grupos,
  servicios,
  puedeEditar,
}: CupsListadoClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <CupsTabla
          cups={cups}
          filtrado={filtrado}
          grupos={grupos}
          servicios={servicios}
          puedeEditar={puedeEditar}
        />

        {total > 0 ? (
          <CupsPaginacion
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(next) =>
              updateParams({ pagina: next > 1 ? String(next) : undefined })
            }
            onPageSizeChange={(size) =>
              updateParams({
                por_pagina: String(size),
                pagina: undefined,
              })
            }
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
