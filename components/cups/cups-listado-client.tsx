"use client"

import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import type { CupsRow } from "@/lib/cups/queries"

import { CupsPaginacion } from "./cups-paginacion"
import { CupsTabla } from "./cups-tabla"

type CupsListadoClientProps = {
  cups: CupsRow[]
  filtrado?: boolean
}

export function CupsListadoClient({
  cups,
  filtrado = false,
}: CupsListadoClientProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [cupsPrevios, setCupsPrevios] = useState(cups)

  // Al cambiar los datos (por ejemplo, al aplicar filtros) volvemos a la
  // primera página para no quedar en una página fuera de rango.
  if (cups !== cupsPrevios) {
    setCupsPrevios(cups)
    setPage(1)
  }

  const total = cups.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paginaActual = Math.min(page, totalPages)
  const currentPageCups = cups.slice(
    (paginaActual - 1) * pageSize,
    paginaActual * pageSize
  )

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <CupsTabla cups={currentPageCups} filtrado={filtrado} />

        {total > 0 ? (
          <CupsPaginacion
            page={paginaActual}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
