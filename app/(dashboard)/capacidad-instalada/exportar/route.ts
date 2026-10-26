import { mismaRegional, requireAlcancePlaneacion } from "@/lib/auth/session"
import {
  resumenInfraestructura,
  type FiltrosInfra,
} from "@/lib/capacidad/agregaciones"
import {
  listFrecuenciasAreas,
  listSedesInfraestructura,
} from "@/lib/capacidad/queries"
import { construirCsv } from "@/lib/frecuencias/importar"

function pick(value: string | null): string | undefined {
  return value && value.length > 0 ? value : undefined
}

export async function GET(request: Request) {
  const alcance = await requireAlcancePlaneacion()
  const { searchParams } = new URL(request.url)

  const [sedes, frecuencias] = await Promise.all([
    listSedesInfraestructura(),
    listFrecuenciasAreas(),
  ])

  const sedesEnAlcance = sedes.filter(
    (sede) => alcance.verTodo || mismaRegional(sede.regional, alcance.regional)
  )
  const sedeIds = new Set(sedesEnAlcance.map((sede) => sede.id))

  const filtros: FiltrosInfra = {
    regional: pick(searchParams.get("i_regional")),
    sede: pick(searchParams.get("i_sede")),
    tipoPoblacion: "activa",
    personalizada: 0,
  }

  const resumen = resumenInfraestructura(
    sedesEnAlcance,
    frecuencias.filter((fila) => sedeIds.has(fila.sedeId)),
    filtros
  )

  const filas = resumen.sedes.map((sede) => ({
    sede: sede.sede,
    regional: sede.regional,
    frecuencia_planeacion:
      sede.frecuenciaPlaneacion ?? "Sin frecuencia de cálculo",
    frecuencia_ejecucion:
      sede.frecuenciaEjecucion ?? "Sin frecuencia de cálculo",
  }))

  const csv = construirCsv(filas)

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="frecuencias-calculo-por-sede.csv"',
    },
  })
}
