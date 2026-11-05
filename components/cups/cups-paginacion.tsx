"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CupsPaginacionProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function CupsPaginacion({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: CupsPaginacionProps) {
  const totalPages = Math.ceil(total / pageSize)
  const [pageSizeOpen, setPageSizeOpen] = useState(false)

  if (total === 0) return null

  const pageSizes = [10, 25, 50, 100]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Mostrar</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            setPageSizeOpen(false)
            onPageSizeChange(Number(value))
          }}
          onOpenChange={setPageSizeOpen}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder={String(pageSize)} />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} filas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>de {total}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => setPageSizeOpen(!pageSizeOpen)}
          aria-label="Opciones de filas por página"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
