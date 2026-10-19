"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

export interface ColumnDef<T> {
  header: string
  accessor: string
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface TableData<T> {
  rows: T[]
  columns: ColumnDef<T>[]
}

export function StandardTable<T extends { id?: string }>({
  data,
}: {
  data: TableData<T>
}) {
  const { rows, columns } = data

  return (
    <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.accessor}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id ?? index}>
              {columns.map((col) => (
                <TableCell key={col.accessor}>
                  {col.render
                    ? col.render(
                        (row as Record<string, unknown>)[col.accessor],
                        row
                      )
                    : ((row as Record<string, unknown>)[
                        col.accessor
                      ] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
