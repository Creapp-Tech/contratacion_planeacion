import {
  alcanceContratos,
  requireAccesoContratacion,
} from "@/lib/auth/session"
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

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export async function ContratosContenido({
  searchParams,
  vista = "ejecucion",
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  vista?: VistaContratos
}) {
  const usuario = await requireAccesoContratacion()
  const alcance = alcanceContratos(usuario)
  const params = await searchParams

  const filtros: ContratoFiltros = {
    q: pick(params.q),
    asegurador: pick(params.asegurador),
    regional: alcance.verTodo
      ? pick(params.regional)
      : (alcance.regionalId ?? undefined),
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

  return (
    <div className="flex flex-col gap-4">
      <ContratoFiltrosBar
        opciones={opciones}
        filtros={{
          q: filtros.q,
          asegurador: filtros.asegurador,
          regional: alcance.verTodo ? filtros.regional : undefined,
        }}
        verRegional={alcance.verTodo}
      />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No se pudieron cargar los contratos. {errorMessage}
        </div>
      ) : null}

      <ContratosTabla
        contratos={contratos}
        mensajeVacio={
          vista === "historial"
            ? "No hay contratos en el historial."
            : "No hay contratos en ejecución."
        }
        volverA={vista === "historial" ? "/historial" : "/contratos"}
        filtrado={Boolean(
          filtros.q ||
            filtros.asegurador ||
            (alcance.verTodo && filtros.regional)
        )}
      />
    </div>
  )
}
