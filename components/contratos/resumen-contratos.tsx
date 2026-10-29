"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import {
  Building2Icon,
  CircleCheckIcon,
  FileTextIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { cn } from "cn"

import { calcularVigencia, type FiltroVigencia } from "@/lib/contratos/constantes"
import type { ContratoRow } from "@/lib/contratos/queries"

type ResumenContratosProps = {
  contratos: ContratoRow[]
  vigencia: FiltroVigencia
}

function TarjetaResumen({
  titulo,
  detalle,
  valor,
  icono,
  activa = false,
  onClick,
}: {
  titulo: string
  detalle: string
  valor: number
  icono: ReactNode
  activa?: boolean
  onClick?: () => void
}) {
  const contenido = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {titulo}
        </span>
        {icono}
      </span>
      <span className="text-2xl font-semibold tabular-nums text-foreground">
        {valor}
      </span>
      <span className="text-xs text-muted-foreground">{detalle}</span>
    </>
  )

  const clases = cn(
    "flex flex-col gap-1 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors",
    onClick &&
      "cursor-pointer hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    activa && "ring-2 ring-primary bg-primary/5"
  )

  if (!onClick) {
    return <div className={clases}>{contenido}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={clases}
    >
      {contenido}
    </button>
  )
}

export function ResumenContratos({
  contratos,
  vigencia,
}: ResumenContratosProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const aseguradoresUnicos = new Set(
    contratos
      .map((contrato) => contrato.aseguradores_eps?.nombre_eps)
      .filter(Boolean)
  ).size

  const totalContratos = contratos.length

  const vigentes = contratos.filter(
    (contrato) => calcularVigencia(contrato.fecha_fin).estado === "vigente"
  ).length

  const proximosAVencer = contratos.filter(
    (contrato) =>
      calcularVigencia(contrato.fecha_fin).estado === "proximo_vencer"
  ).length

  function aplicarFiltro(filtro: FiltroVigencia) {
    // Al hacer clic en el filtro ya activo se vuelve a "todos".
    const destino: FiltroVigencia =
      filtro !== "todos" && filtro === vigencia ? "todos" : filtro

    const params = new URLSearchParams(searchParams.toString())
    if (destino === "todos") {
      params.delete("vigencia")
    } else {
      params.set("vigencia", destino)
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <TarjetaResumen
        titulo="Aseguradores únicos"
        detalle="EPS con contratos"
        valor={aseguradoresUnicos}
        icono={<Building2Icon className="size-5 text-muted-foreground" />}
      />
      <TarjetaResumen
        titulo="Contratos"
        detalle="En el listado actual"
        valor={totalContratos}
        icono={<FileTextIcon className="size-5 text-muted-foreground" />}
        activa={vigencia === "todos"}
        onClick={() => aplicarFiltro("todos")}
      />
      <TarjetaResumen
        titulo="Vigentes"
        detalle="Más de 75 días para vencer"
        valor={vigentes}
        icono={<CircleCheckIcon className="size-5 text-emerald-600" />}
        activa={vigencia === "vigente"}
        onClick={() => aplicarFiltro("vigente")}
      />
      <TarjetaResumen
        titulo="Próximo a vencer"
        detalle="75 días o menos"
        valor={proximosAVencer}
        icono={<TriangleAlertIcon className="size-5 text-amber-600" />}
        activa={vigencia === "proximo_vencer"}
        onClick={() => aplicarFiltro("proximo_vencer")}
      />
    </div>
  )
}
