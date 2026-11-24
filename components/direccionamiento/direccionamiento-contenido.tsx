import { alcanceDireccionamiento } from "@/lib/auth/session"
import {
  OPCIONES_DIRECCIONAMIENTO_VACIAS,
  type DireccionamientoFiltros,
  type ResumenDireccionamiento,
} from "@/lib/direccionamiento/types"
import {
  listEspecialistas,
  listOpcionesDireccionamiento,
  resumenDireccionamiento,
} from "@/lib/direccionamiento/queries"

import { DireccionamientoFiltrosBar } from "./direccionamiento-filtros"
import { DireccionamientoTabla } from "./direccionamiento-tabla"

const RESUMEN_VACIO: ResumenDireccionamiento = {
  especialistas: 0,
  conContratosVigentes: 0,
  aseguradoresRelacionados: 0,
  sedesDireccionadas: 0,
  pendientesValidacion: 0,
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

export async function DireccionamientoContenido({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [alcance, params] = await Promise.all([
    alcanceDireccionamiento(),
    searchParams,
  ])

  // La restricción de acceso no depende de lo que venga en la URL.
  const regional = alcance.verTodo ? pick(params.regional) : alcance.regional ?? undefined

  const filtros: DireccionamientoFiltros = {
    q: pick(params.q),
    regional,
    ciudad: pick(params.ciudad),
    aseguradorId: pick(params.asegurador),
    especialidad: pick(params.especialidad),
    estado: pick(params.estado),
    page: pickNumero(params.page),
  }

  let lista: Awaited<ReturnType<typeof listEspecialistas>> = {
    rows: [],
    total: 0,
    page: 1,
    pageSize: 10,
  }
  let opciones = OPCIONES_DIRECCIONAMIENTO_VACIAS
  let resumen = RESUMEN_VACIO
  let errorMessage: string | null = null

  try {
    const [listaRes, opcionesRes, resumenRes] = await Promise.all([
      listEspecialistas(filtros),
      listOpcionesDireccionamiento(),
      resumenDireccionamiento(regional),
    ])
    lista = listaRes
    opciones = opcionesRes
    resumen = resumenRes
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el direccionamiento."
  }

  return (
    <div className="flex flex-col gap-4">
      <DireccionamientoFiltrosBar
        filtros={filtros}
        opciones={opciones}
        verRegional={alcance.verTodo}
      />
      {errorMessage ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          No se pudieron cargar los datos. {errorMessage}
        </div>
      ) : null}
      <DireccionamientoTabla
        filas={lista.rows}
        resumen={resumen}
        total={lista.total}
        page={lista.page}
        pageSize={lista.pageSize}
        rol={alcance.usuario.rol}
        regionalUsuario={alcance.regional}
        usuarioId={alcance.usuario.id}
        filtros={filtros}
      />
    </div>
  )
}
