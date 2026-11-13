"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatearFecha, formatearMoneda } from "@/lib/contratos/constantes"
import type { ContratoDashboard } from "@/lib/contratos/dashboard-queries"

type ColumnaOrden =
  | "contrato"
  | "aseguradora"
  | "regimen"
  | "regional"
  | "ciudad"
  | "pais"
  | "legalizacion"
  | "ejecucion"
  | "fecha_inicio"
  | "fecha_fin"
  | "valor_total"

type Direccion = "asc" | "desc"

const COLUMNAS: Array<{ clave: ColumnaOrden; etiqueta: string }> = [
  { clave: "contrato", etiqueta: "Contrato" },
  { clave: "aseguradora", etiqueta: "Aseguradora" },
  { clave: "regimen", etiqueta: "Régimen" },
  { clave: "regional", etiqueta: "Regional" },
  { clave: "ciudad", etiqueta: "Ciudad" },
  { clave: "pais", etiqueta: "País" },
  { clave: "legalizacion", etiqueta: "Legalización" },
  { clave: "ejecucion", etiqueta: "Ejecución" },
  { clave: "fecha_inicio", etiqueta: "Fecha inicio" },
  { clave: "fecha_fin", etiqueta: "Fecha fin" },
  { clave: "valor_total", etiqueta: "Valor total" },
]

const TAMANOS_PAGINA = [10, 25, 50] as const

const ITEMS_TAMANO: Record<string, string> = Object.fromEntries(
  TAMANOS_PAGINA.map((valor) => [String(valor), `${valor} por página`])
)

const COLABORADOR = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
})

const formateadorNumero = new Intl.NumberFormat("es-CO")

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
}

function nombresRegimen(contrato: ContratoDashboard): string {
  return contrato.regimenes
    .map((regimen) => regimen.nombre.trim())
    .filter(Boolean)
    .sort((a, b) => COLABORADOR.compare(a, b))
    .join(", ")
}

function nombresRegional(contrato: ContratoDashboard): string {
  return contrato.regionales
    .map((regional) => regional.nombre.trim())
    .filter(Boolean)
    .sort((a, b) => COLABORADOR.compare(a, b))
    .join(", ")
}

function textoBusqueda(contrato: ContratoDashboard): string {
  return normalizar(
    [
      contrato.numero_contrato,
      contrato.nombre,
      contrato.aseguradora ?? "",
      contrato.ciudad,
      contrato.pais ?? "",
      contrato.estado_legalizacion ?? "",
      contrato.estado_ejecucion ?? "",
      nombresRegimen(contrato),
      nombresRegional(contrato),
    ].join(" ")
  )
}

function compararValores(
  a: string | number | null,
  b: string | number | null,
  factor: number
): number {
  // Los valores vacíos siempre quedan al final, sin importar la dirección.
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1

  if (typeof a === "number" && typeof b === "number") {
    return factor * (a - b)
  }

  return factor * COLABORADOR.compare(String(a), String(b))
}

function comparar(
  a: ContratoDashboard,
  b: ContratoDashboard,
  columna: ColumnaOrden,
  direccion: Direccion
): number {
  const factor = direccion === "asc" ? 1 : -1

  switch (columna) {
    case "contrato": {
      const numero = compararValores(
        a.numero_contrato,
        b.numero_contrato,
        factor
      )
      return numero !== 0
        ? numero
        : factor * COLABORADOR.compare(a.nombre, b.nombre)
    }
    case "aseguradora":
      return compararValores(a.aseguradora, b.aseguradora, factor)
    case "regimen":
      return compararValores(nombresRegimen(a), nombresRegimen(b), factor)
    case "regional":
      return compararValores(nombresRegional(a), nombresRegional(b), factor)
    case "ciudad":
      return compararValores(a.ciudad, b.ciudad, factor)
    case "pais":
      return compararValores(a.pais, b.pais, factor)
    case "legalizacion":
      return compararValores(
        a.estado_legalizacion,
        b.estado_legalizacion,
        factor
      )
    case "ejecucion":
      return compararValores(a.estado_ejecucion, b.estado_ejecucion, factor)
    case "fecha_inicio":
      return compararValores(a.fecha_inicio, b.fecha_inicio, factor)
    case "fecha_fin":
      return compararValores(a.fecha_fin, b.fecha_fin, factor)
    case "valor_total":
      return compararValores(a.valor_total, b.valor_total, factor)
  }
}

function clasesLegalizacion(estado: string): string {
  const normalizado = normalizar(estado)
  if (normalizado === "legalizado") {
    return "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
  }
  if (normalizado === "no legalizado") {
    return "border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-400"
  }
  return ""
}

function clasesEjecucion(estado: string): string {
  const normalizado = normalizar(estado)
  if (normalizado === "en ejecucion") {
    return "border-sky-600/30 bg-sky-600/10 text-sky-700 dark:text-sky-400"
  }
  if (normalizado === "finalizado") {
    return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300"
  }
  return ""
}

function TextoTruncado({
  texto,
  className,
}: {
  texto: string
  className?: string
}) {
  return (
    <span className={className ? `block truncate ${className}` : "block truncate"} title={texto}>
      {texto}
    </span>
  )
}

export function DashboardTabla({
  contratos,
}: {
  contratos: ContratoDashboard[]
}) {
  const [busqueda, setBusqueda] = useState("")
  const [orden, setOrden] = useState<ColumnaOrden>("contrato")
  const [direccion, setDireccion] = useState<Direccion>("asc")
  const [pagina, setPagina] = useState(0)
  const [tamanoPagina, setTamanoPagina] = useState<number>(10)

  const consulta = normalizar(busqueda)

  const filtrados = useMemo(() => {
    if (!consulta) return contratos
    return contratos.filter((contrato) =>
      textoBusqueda(contrato).includes(consulta)
    )
  }, [contratos, consulta])

  const ordenados = useMemo(() => {
    const copia = [...filtrados]
    copia.sort((a, b) => comparar(a, b, orden, direccion))
    return copia
  }, [filtrados, orden, direccion])

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / tamanoPagina))
  const paginaActual = Math.min(pagina, totalPaginas - 1)
  const inicio = paginaActual * tamanoPagina
  const filasPagina = ordenados.slice(inicio, inicio + tamanoPagina)
  const desde = ordenados.length === 0 ? 0 : inicio + 1
  const hasta = Math.min(inicio + tamanoPagina, ordenados.length)

  if (contratos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No hay contratos que coincidan con los filtros.
      </div>
    )
  }

  function alternarOrden(clave: ColumnaOrden) {
    setPagina(0)
    if (clave === orden) {
      setDireccion((actual) => (actual === "asc" ? "desc" : "asc"))
      return
    }
    setOrden(clave)
    setDireccion("asc")
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              setPagina(0)
            }}
            placeholder="Buscar contrato, EPS, ciudad, regional..."
            className="pl-8"
            aria-label="Buscar contratos"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Haz clic en un encabezado para ordenar.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNAS.map((columna) => {
              const activa = orden === columna.clave
              return (
                <TableHead
                  key={columna.clave}
                  scope="col"
                  aria-sort={
                    activa
                      ? direccion === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => alternarOrden(columna.clave)}
                    className="flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {columna.etiqueta}
                    {activa ? (
                      direccion === "asc" ? (
                        <ArrowUpIcon className="size-3.5" />
                      ) : (
                        <ArrowDownIcon className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDownIcon className="size-3.5 opacity-40" />
                    )}
                  </button>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filasPagina.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMNAS.length}
                className="h-24 text-center text-muted-foreground"
              >
                No hay contratos que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          ) : (
            filasPagina.map((contrato) => (
              <TableRow key={contrato.id}>
                <TableCell>
                  <div className="flex max-w-72 flex-col">
                    <TextoTruncado
                      texto={contrato.nombre}
                      className="font-medium"
                    />
                    <span className="text-xs text-muted-foreground">
                      {contrato.numero_contrato}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <TextoTruncado
                    texto={contrato.aseguradora ?? "—"}
                    className="max-w-56"
                  />
                </TableCell>
                <TableCell>
                  {contrato.regimenes.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex max-w-48 flex-wrap gap-1">
                      {contrato.regimenes.map((regimen) => (
                        <Badge key={regimen.id} variant="outline">
                          {regimen.nombre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {contrato.regionales.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex max-w-48 flex-wrap gap-1">
                      {contrato.regionales.map((regional) => (
                        <Badge key={regional.id} variant="outline">
                          {regional.nombre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <TextoTruncado
                    texto={contrato.ciudad || "—"}
                    className="max-w-52"
                  />
                </TableCell>
                <TableCell>{contrato.pais ?? "—"}</TableCell>
                <TableCell>
                  {contrato.estado_legalizacion ? (
                    <Badge
                      variant="outline"
                      className={clasesLegalizacion(
                        contrato.estado_legalizacion
                      )}
                    >
                      {contrato.estado_legalizacion}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {contrato.estado_ejecucion ? (
                    <Badge
                      variant="outline"
                      className={clasesEjecucion(contrato.estado_ejecucion)}
                    >
                      {contrato.estado_ejecucion}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{formatearFecha(contrato.fecha_inicio)}</TableCell>
                <TableCell>{formatearFecha(contrato.fecha_fin)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearMoneda(contrato.valor_total)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {formateadorNumero.format(desde)}–
            {formateadorNumero.format(hasta)}
          </span>{" "}
          de {formateadorNumero.format(ordenados.length)} contratos
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(tamanoPagina)}
            onValueChange={(valor) => {
              setTamanoPagina(Number(valor) || 10)
              setPagina(0)
            }}
            items={ITEMS_TAMANO}
          >
            <SelectTrigger size="sm" aria-label="Contratos por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANOS_PAGINA.map((valor) => (
                <SelectItem key={valor} value={String(valor)}>
                  {ITEMS_TAMANO[String(valor)]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPagina(Math.max(0, paginaActual - 1))}
            disabled={paginaActual === 0}
          >
            <ChevronLeftIcon />
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Página {paginaActual + 1} de {totalPaginas}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setPagina(Math.min(totalPaginas - 1, paginaActual + 1))
            }
            disabled={paginaActual >= totalPaginas - 1}
          >
            Siguiente
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
