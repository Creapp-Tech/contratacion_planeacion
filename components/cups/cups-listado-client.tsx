"use client"

import { useState } from "react"

import { CupsTabla } from "./cups-tabla"
import { CupsPaginacion } from "./cups-paginacion"

type CupsListadoClientProps = {
  cups: any[]
  filtrado?: boolean
}

export function CupsListadoClient({
  cups,
  filtrado = false,
}: CupsListadoClientProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const total = cups.length
  const totalPages = Math.ceil(total / pageSize)
  const currentPageCups = cups.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-col gap-4">
      <CupsTabla cups={currentPageCups} filtrado={hayFiltros(filtrado, total)} />

      {total > 0 && (
        <CupsPaginacion
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}

function hayFiltros(filtrado: boolean, total: number): boolean {
  return filtrado && total === 0
}
