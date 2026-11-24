import { alcanceDireccionamiento } from "@/lib/auth/session"
import {
  TAMANO_PAGINA,
  TAMANO_PAGINA_MAX,
} from "@/lib/aseguradores-contratos/constantes"
import { puedeEditarServicioAsegurador } from "@/lib/aseguradores-contratos/permisos"
import {
  listOpcionesAseguradoresContratos,
  listServiciosCups,
  resumenServiciosCups,
} from "@/lib/aseguradores-contratos/queries"
import {
  OPCIONES_VACIAS,
  type AseguradoresContratosFiltros,
  type ResumenAseguradoresContratos,
} from "@/lib/aseguradores-contratos/types"

import { FiltrosServicios } from "./filtros"
import { KpisServicios } from "./kpis"
import { TablaServiciosCups } from "./tabla"

const RESUMEN_VACIO: ResumenAseguradoresContratos = {
  servicios: 0,
  contratos: 0,
  aseguradores: 0,
  conCupsResolucion: 0,
  cmePromedio: 0,
}

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined
}

function pickNumero(value: string | string[] | undefined) {
  const texto = pick(value)
  if (!texto) return undefined
  const numero = Number(texto)
  return Number.isInteger(numero) && numero > 0 ? numero : undefined
}

export async function AseguradoresContratosContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [alcance, params] = await Promise.all([
    alcanceDireccionamiento(),
    searchParams,
  ])

  // La regional efectiva no depende de lo que venga en la URL.
  const regional = alcance.verTodo
    ? pick(params.regional)
    : alcance.regional ?? undefined

  const filtros: AseguradoresContratosFiltros = {
    q: pick(params.q),
    aseguradorId: pick(params.asegurador),
    contratoId: pick(params.contrato),
    opcionId: pick(params.opcion),
    regional,
    page: pickNumero(params.page),
    pageSize: pickNumero(params.pageSize),
  }

  let lista: Awaited<ReturnType<typeof listServiciosCups>> = {
    rows: [],
    total: 0,
    page: 1,
    pageSize: TAMANO_PAGINA,
  }
  let opciones = OPCIONES_VACIAS
  let resumen = RESUMEN_VACIO
  let errorMessage: string | null = null

  try {
    const [listaRes, opcionesRes, resumenRes] = await Promise.all([
      listServiciosCups(filtros, regional),
      listOpcionesAseguradoresContratos(),
      resumenServiciosCups(regional),
    ])
    lista = listaRes
    opciones = opcionesRes
    resumen = resumenRes
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar los servicios CUPS."
  }

  const regionales = [
    ...new Set(
      opciones.contratos.flatMap((contrato) => contrato.regionales)
    ),
  ].sort((a, b) => a.localeCompare(b, "es"))

  const editables = lista.rows
    .filter((fila) =>
      puedeEditarServicioAsegurador(
        alcance.usuario.rol,
        alcance.regional,
        fila.contratoRegionales,
        fila.created_by,
        alcance.usuario.id
      )
    )
    .map((fila) => fila.id)

  return (
    <div className="flex flex-col gap-4">
      <FiltrosServicios
        filtros={filtros}
        opciones={opciones}
        regionales={regionales}
        verRegional={alcance.verTodo}
      />
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No se pudieron cargar los datos. {errorMessage}
        </div>
      ) : null}
      <KpisServicios resumen={resumen} />
      <TablaServiciosCups
        filas={lista.rows}
        total={lista.total}
        page={lista.page}
        pageSize={Math.min(lista.pageSize, TAMANO_PAGINA_MAX)}
        filtros={filtros}
        opciones={opciones.especialistas}
        editables={editables}
      />
    </div>
  )
}
