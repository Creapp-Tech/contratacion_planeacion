import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
import {
  RUTAS_CONTRATOS,
  type AmbitoContratos,
  type FiltroVigencia,
} from "@/lib/contratos/constantes"
import {
  OPCIONES_CONTRATO_VACIAS,
  listContratos,
  listOpcionesContrato,
  type ContratoFiltros,
  type ContratoRow,
  type OpcionesContrato,
  type VistaContratos,
} from "@/lib/contratos/queries"

import { ContratoFiltros as ContratoFiltrosBar } from "./contrato-filtros"
import { ContratosTabla } from "./contratos-tabla"
import { ResumenContratos } from "./resumen-contratos"

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function pickArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)
}

function pickVigencia(value: string | string[] | undefined): FiltroVigencia {
  return value === "vigente" ||
    value === "proximo_vencer" ||
    value === "vencido"
    ? value
    : "todos"
}

export async function ContratosContenido({
  searchParams,
  vista = "ejecucion",
  ambito,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  vista?: VistaContratos
  ambito?: AmbitoContratos
}) {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)
  const params = await searchParams
  const vigencia = pickVigencia(params.vigencia)

  const filtros: ContratoFiltros = {
    q: pick(params.q),
    ambito,
    pais:
      ambito === "internacional" ? pickArray(params.pais) : undefined,
    asegurador: pickArray(params.asegurador),
    regional: alcance.verTodo
      ? pickArray(params.regional)
      : alcance.regionalId
        ? [alcance.regionalId]
        : undefined,
    estadoLegalizacion: pickArray(params.legalizacion),
    vista,
  }

  let contratos: ContratoRow[] = []
  let opciones: OpcionesContrato = OPCIONES_CONTRATO_VACIAS
  let errorMessage: string | null = null

  try {
    const [contratosResultado, opcionesResultado] = await Promise.all([
      listContratos(filtros, alcance),
      listOpcionesContrato(alcance),
    ])
    contratos = contratosResultado
    opciones = opcionesResultado
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al cargar los contratos."
  }

  const volverA =
    vista === "historial"
      ? "/historial"
      : ambito
        ? RUTAS_CONTRATOS[ambito]
        : RUTAS_CONTRATOS.nacional

  return (
    <div className="flex flex-col gap-4">
      <ResumenContratos contratos={contratos} vigencia={vigencia} />

      <ContratoFiltrosBar
        opciones={opciones}
        filtros={{
          q: filtros.q,
          pais: filtros.pais,
          asegurador: filtros.asegurador,
          regional: alcance.verTodo ? filtros.regional : undefined,
          estadoLegalizacion: filtros.estadoLegalizacion,
        }}
        verRegional={alcance.verTodo}
        verPais={ambito === "internacional"}
      />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No se pudieron cargar los contratos. {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto max-w-full">
        <ContratosTabla
          contratos={contratos}
          vigencia={vigencia}
          mostrarPais={ambito === "internacional"}
          mensajeVacio={
            vista === "historial"
              ? "No hay contratos en el historial."
              : ambito === "internacional"
                ? "No hay contratos internacionales en ejecución."
                : "No hay contratos nacionales en ejecución."
          }
          volverA={volverA}
          filtrado={Boolean(
            filtros.q ||
              filtros.pais ||
              filtros.asegurador ||
              (alcance.verTodo && filtros.regional) ||
              filtros.estadoLegalizacion ||
              vigencia !== "todos"
          )}
        />
      </div>
    </div>
  )
}
