import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  DOMINIOS_CATALOGO_DIRECCIONAMIENTO,
  TAMANO_PAGINA,
  TAMANO_PAGINA_MAX,
} from "@/lib/direccionamiento/constantes"
import type {
  AsignacionDetalle,
  ContratoDetalle,
  CupsOpcion,
  DireccionamientoDetalle,
  DireccionamientoFiltros,
  EspecialistaListaFila,
  EspecialistaRow,
  HistorialRow,
  ListaResultado,
  NovedadDetalle,
  OpcionesDireccionamiento,
  ResumenDireccionamiento,
  ServicioDetalle,
} from "@/lib/direccionamiento/types"

type AsignacionAnidada = {
  id: string
  sedes: { regional: string | null } | null
}

type ContratoAnidado = {
  id: string
  asegurador_eps_id: string
  servicios_contratados_especialistas:
    | { id: string; sedes_servicios_especialistas: AsignacionAnidada[] | null }[]
    | null
}

type EspecialistaCrudo = EspecialistaRow & {
  contratos_especialistas: ContratoAnidado[] | null
}

const CAMPOS_ESPECIALISTA =
  "id, tipo_identificacion, numero_identificacion, nombre_completo, tipo_persona, especialidad, ciudad, estado, created_by, updated_by, created_at, updated_at"

const CAMPOS_ESPECIALISTA_LISTA = `${CAMPOS_ESPECIALISTA}, contratos_especialistas(id, asegurador_eps_id, servicios_contratados_especialistas(id, sedes_servicios_especialistas(id, sedes(regional))))`

/** Regionales únicas, en orden estable, a partir de las sedes asignadas. */
function regionalesDeAsignaciones(
  asignaciones: { sedes: { regional: string | null } | null }[]
): string[] {
  return [
    ...new Set(
      asignaciones
        .map((a) => a.sedes?.regional?.trim())
        .filter((regional): regional is string => Boolean(regional))
    ),
  ].sort((a, b) => a.localeCompare(b, "es"))
}

function mapearFila(fila: EspecialistaCrudo): EspecialistaListaFila {
  const { contratos_especialistas, ...especialista } = fila
  const contratos = contratos_especialistas ?? []
  const servicios = contratos.flatMap(
    (contrato) => contrato.servicios_contratados_especialistas ?? []
  )
  const asignaciones = servicios.flatMap(
    (servicio) => servicio.sedes_servicios_especialistas ?? []
  )

  return {
    ...especialista,
    regionales: regionalesDeAsignaciones(asignaciones),
    contratos: contratos.length,
    aseguradores: new Set(contratos.map((c) => c.asegurador_eps_id)).size,
    servicios: servicios.length,
    sedes: asignaciones.length,
  }
}

/**
 * Ids de especialistas con al menos una sede asignada en la regional dada.
 * La regional ya no vive en el especialista: se resuelve desde public.sedes.
 */
async function idsEspecialistasPorRegional(
  admin: ReturnType<typeof createAdminClient>,
  regional: string
): Promise<string[] | null> {
  const { data, error } = await admin
    .from("sedes_servicios_especialistas")
    .select("especialista_id, sedes!inner(regional)")
    .ilike("sedes.regional", regional.trim())

  if (error) throw error
  return [
    ...new Set((data ?? []).map((fila) => fila.especialista_id as string)),
  ]
}

/** Regionales del especialista, derivadas de sus sedes asignadas. */
export async function regionalesEspecialista(id: string): Promise<string[]> {
  const { data, error } = await createAdminClient()
    .from("sedes_servicios_especialistas")
    .select("sedes(regional)")
    .eq("especialista_id", id)

  if (error) throw error
  return regionalesDeAsignaciones(
    (data ?? []) as unknown as { sedes: { regional: string | null } | null }[]
  )
}

export async function listEspecialistas(
  filtros: DireccionamientoFiltros = {}
): Promise<ListaResultado<EspecialistaListaFila>> {
  const admin = createAdminClient()
  const pageSize = Math.min(
    Math.max(Math.trunc(filtros.pageSize ?? TAMANO_PAGINA), 1),
    TAMANO_PAGINA_MAX
  )
  const page = Math.max(Math.trunc(filtros.page ?? 1), 1)

  let query = admin
    .from("especialistas")
    .select(CAMPOS_ESPECIALISTA_LISTA, { count: "exact" })

  if (filtros.regional) {
    const ids = await idsEspecialistasPorRegional(admin, filtros.regional)
    if (!ids || ids.length === 0) {
      return { rows: [], total: 0, page, pageSize }
    }
    query = query.in("id", ids)
  }
  if (filtros.ciudad) {
    query = query.ilike("ciudad", `%${filtros.ciudad.replace(/[%*]/g, "")}%`)
  }
  if (filtros.especialidad) {
    query = query.eq("especialidad", filtros.especialidad)
  }
  if (filtros.estado) {
    query = query.eq("estado", filtros.estado)
  }
  if (filtros.q) {
    const termino = filtros.q.replace(/[,()\\*]/g, " ").trim()
    if (termino) {
      query = query.or(
        `nombre_completo.ilike.*${termino}*,numero_identificacion.ilike.*${termino}*`
      )
    }
  }
  if (filtros.aseguradorId) {
    const { data: contratos, error } = await admin
      .from("contratos_especialistas")
      .select("especialista_id")
      .eq("asegurador_eps_id", filtros.aseguradorId)

    if (error) throw error
    const ids = [
      ...new Set((contratos ?? []).map((c) => c.especialista_id as string)),
    ]
    if (ids.length === 0) {
      return { rows: [], total: 0, page, pageSize }
    }
    query = query.in("id", ids)
  }

  const desde = (page - 1) * pageSize
  const { data, error, count } = await query
    .order("nombre_completo", { ascending: true })
    .order("id", { ascending: true })
    .range(desde, desde + pageSize - 1)

  if (error) throw error

  return {
    rows: ((data ?? []) as unknown as EspecialistaCrudo[]).map(mapearFila),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getEspecialista(
  id: string
): Promise<EspecialistaRow | null> {
  const { data, error } = await createAdminClient()
    .from("especialistas")
    .select(CAMPOS_ESPECIALISTA)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data as EspecialistaRow | null) ?? null
}

export async function getDetalleDireccionamiento(
  id: string
): Promise<DireccionamientoDetalle | null> {
  const admin = createAdminClient()

  const [especialistaRes, contratosRes, serviciosRes, asignacionesRes, novedadesRes] =
    await Promise.all([
      admin
        .from("especialistas")
        .select(CAMPOS_ESPECIALISTA)
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("contratos_especialistas")
        .select(
          `*, aseguradores_eps(nombre_eps), regimenes(nombre), servicios_contratados_especialistas(id, sedes_servicios_especialistas(id))`
        )
        .eq("especialista_id", id)
        .order("fecha_inicio", { ascending: false }),
      admin
        .from("servicios_contratados_especialistas")
        .select(
          `*, cups(id, codigo, nombre), contratos_especialistas!inner(id, numero_contrato, asegurador_eps_id, aseguradores_eps(nombre_eps)), sedes_servicios_especialistas(id)`
        )
        .eq("contratos_especialistas.especialista_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("sedes_servicios_especialistas")
        .select(
          `*, sedes(id, nombre, regional), contratos_especialistas(id, numero_contrato, aseguradores_eps(nombre_eps)), servicios_contratados_especialistas(id, cups(codigo, nombre))`
        )
        .eq("especialista_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("novedades_direccionamiento")
        .select(
          `*, contratos_especialistas(id, numero_contrato, aseguradores_eps(nombre_eps)), servicios_contratados_especialistas(id, cups(codigo, nombre)), sedes_servicios_especialistas(id, sedes(nombre))`
        )
        .eq("especialista_id", id)
        .order("created_at", { ascending: false }),
    ])

  if (especialistaRes.error) throw especialistaRes.error
  if (!especialistaRes.data) return null
  if (contratosRes.error) throw contratosRes.error
  if (serviciosRes.error) throw serviciosRes.error
  if (asignacionesRes.error) throw asignacionesRes.error
  if (novedadesRes.error) throw novedadesRes.error

  const contratosCrudos = (contratosRes.data ?? []) as (ContratoDetalle & {
    servicios_contratados_especialistas:
      | { id: string; sedes_servicios_especialistas: { id: string }[] | null }[]
      | null
  })[]

  const contratos: ContratoDetalle[] = contratosCrudos.map((contrato) => {
    const { servicios_contratados_especialistas: servicios, ...resto } = contrato
    const lista = servicios ?? []
    return {
      ...resto,
      servicios: lista.length,
      sedes: lista.reduce(
        (total, servicio) =>
          total + (servicio.sedes_servicios_especialistas?.length ?? 0),
        0
      ),
    }
  })

  const servicios: ServicioDetalle[] = (
    serviciosRes.data ?? []
  ).map((servicio) => {
    const fila = servicio as ServicioDetalle
    return {
      ...fila,
      sedes: fila.sedes_servicios_especialistas?.length ?? 0,
    }
  })

  const asignaciones = (asignacionesRes.data ?? []) as AsignacionDetalle[]
  const novedades = (novedadesRes.data ?? []) as NovedadDetalle[]
  const regionales = regionalesDeAsignaciones(asignaciones)

  const idsHistorial = [
    id,
    ...contratos.map((c) => c.id),
    ...servicios.map((s) => s.id),
    ...asignaciones.map((a) => a.id),
    ...novedades.map((n) => n.id),
  ]

  const { data: historial, error: errorHistorial } = await admin
    .from("historial_cambios_direccionamiento")
    .select("*, usuarios(nombre_completo)")
    .in("registro_id", idsHistorial)
    .order("created_at", { ascending: false })
    .limit(300)

  if (errorHistorial) throw errorHistorial

  return {
    especialista: especialistaRes.data as EspecialistaRow,
    regionales,
    contratos,
    servicios,
    asignaciones,
    novedades,
    historial: (historial ?? []) as HistorialRow[],
  }
}

export async function listOpcionesDireccionamiento(): Promise<OpcionesDireccionamiento> {
  const admin = createAdminClient()
  const [catalogosRes, aseguradoresRes, regimenesRes, sedesRes] = await Promise.all([
    admin
      .from("catalogos_opciones")
      .select("dominio, nombre")
      .in("dominio", [...DOMINIOS_CATALOGO_DIRECCIONAMIENTO])
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    admin
      .from("aseguradores_eps")
      .select("id, nombre_eps")
      .order("nombre_eps", { ascending: true }),
    admin
      .from("regimenes")
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    admin
      .from("sedes")
      .select("id, nombre, regional")
      .order("nombre", { ascending: true }),
  ])

  if (catalogosRes.error) throw catalogosRes.error
  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (regimenesRes.error) throw regimenesRes.error
  if (sedesRes.error) throw sedesRes.error

  const porDominio: Record<string, string[]> = {}
  for (const fila of (catalogosRes.data ?? []) as {
    dominio: string
    nombre: string
  }[]) {
    if (!porDominio[fila.dominio]) porDominio[fila.dominio] = []
    porDominio[fila.dominio].push(fila.nombre)
  }

  return {
    tiposIdentificacion: porDominio.tipo_identificacion ?? [],
    especialidades: porDominio.especialidad ?? [],
    modalidadesPrestacion: porDominio.modalidad_prestacion ?? [],
    modalidadesContratacion: porDominio.modalidad_contratacion ?? [],
    tiposRed: porDominio.tipo_red ?? [],
    tiposNovedad: porDominio.tipo_novedad ?? [],
    agrupadores: porDominio.agrupador ?? [],
    tiposImagen: porDominio.tipo_imagen ?? [],
    manualesTarifario: porDominio.manual_tarifario ?? [],
    // El filtro por regional se alimenta de las sedes, no del especialista.
    regionales: [
      ...new Set(
        ((sedesRes.data ?? []) as { regional: string | null }[])
          .map((sede) => sede.regional?.trim())
          .filter((regional): regional is string => Boolean(regional))
      ),
    ].sort((a, b) => a.localeCompare(b, "es")),
    aseguradores: (aseguradoresRes.data ?? []).map((a) => ({
      id: a.id as string,
      nombre: a.nombre_eps as string,
    })),
    regimenes: (regimenesRes.data ?? []).map((r) => ({
      id: r.id as string,
      nombre: r.nombre as string,
    })),
    sedes: (sedesRes.data ?? []) as {
      id: string
      nombre: string
      regional: string | null
    }[],
  }
}

export async function resumenDireccionamiento(
  regional?: string
): Promise<ResumenDireccionamiento> {
  const admin = createAdminClient()
  const vacio: ResumenDireccionamiento = {
    especialistas: 0,
    conContratosVigentes: 0,
    aseguradoresRelacionados: 0,
    sedesDireccionadas: 0,
    pendientesValidacion: 0,
  }

  let ids: { id: string }[] = []
  if (regional) {
    const idsRegional = await idsEspecialistasPorRegional(admin, regional)
    if (!idsRegional || idsRegional.length === 0) return vacio
    const { data, error } = await admin
      .from("especialistas")
      .select("id")
      .in("id", idsRegional)
    if (error) throw error
    ids = (data ?? []) as { id: string }[]
  } else {
    const { data, error } = await admin.from("especialistas").select("id")
    if (error) throw error
    ids = (data ?? []) as { id: string }[]
  }

  if (ids.length === 0) return vacio
  const idsEspecialistas = ids.map((e) => e.id)

  const [contratosRes, asignacionesRes, pendientesRes] = await Promise.all([
    admin
      .from("contratos_especialistas")
      .select("especialista_id, asegurador_eps_id, estado, fecha_inicio, fecha_terminacion")
      .in("especialista_id", idsEspecialistas),
    admin
      .from("sedes_servicios_especialistas")
      .select("sede_id")
      .in("especialista_id", idsEspecialistas),
    admin
      .from("novedades_direccionamiento")
      .select("id", { count: "exact", head: true })
      .in("especialista_id", idsEspecialistas)
      .eq("estado_validacion", "pendiente"),
  ])

  if (contratosRes.error) throw contratosRes.error
  if (asignacionesRes.error) throw asignacionesRes.error
  if (pendientesRes.error) throw pendientesRes.error

  const contratos = (contratosRes.data ?? []) as {
    especialista_id: string
    asegurador_eps_id: string
    estado: string
    fecha_inicio: string | null
    fecha_terminacion: string | null
  }[]
  const asignaciones = (asignacionesRes.data ?? []) as { sede_id: string }[]
  const hoy = new Date().toISOString().slice(0, 10)
  const conContratosVigentes = new Set(
    contratos
      .filter(
        (contrato) =>
          contrato.estado === "activo" &&
          (!contrato.fecha_inicio || contrato.fecha_inicio <= hoy) &&
          (!contrato.fecha_terminacion || contrato.fecha_terminacion >= hoy)
      )
      .map((contrato) => contrato.especialista_id)
  )

  return {
    especialistas: ids.length,
    conContratosVigentes: conContratosVigentes.size,
    aseguradoresRelacionados: new Set(
      contratos.map((contrato) => contrato.asegurador_eps_id)
    ).size,
    sedesDireccionadas: new Set(asignaciones.map((a) => a.sede_id)).size,
    pendientesValidacion: pendientesRes.count ?? 0,
  }
}

type CupsCrudo = {
  id: string
  codigo: string
  nombre: string | null
  descripcion: string | null
  grupos_servicio: { nombre: string } | null
  servicios: { nombre: string } | null
}

const CAMPOS_CUPS =
  "id, codigo, nombre, descripcion, grupos_servicio(nombre), servicios(nombre)"

function mapearCups(fila: CupsCrudo): CupsOpcion {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    agrupador: fila.grupos_servicio?.nombre?.trim() || null,
    especialidad: fila.servicios?.nombre?.trim() || null,
  }
}

export async function buscarCups(termino: string): Promise<CupsOpcion[]> {
  const limpio = termino
    .trim()
    .replace(/[,()\\*]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80)

  let query = createAdminClient()
    .from("cups")
    .select(CAMPOS_CUPS)
    .order("codigo", { ascending: true })
    .limit(25)

  if (limpio) {
    query = query.or(`codigo.ilike.*${limpio}*,nombre.ilike.*${limpio}*`)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as CupsCrudo[]).map(mapearCups)
}

/**
 * Fuente autoritativa de agrupador y especialidad al guardar un servicio CUPS.
 * Se resuelve desde cups -> grupos_servicio / servicios, nunca del formulario.
 */
export async function getCupsDerivados(
  id: string
): Promise<{ agrupador: string | null; especialidad: string | null } | null> {
  const { data, error } = await createAdminClient()
    .from("cups")
    .select("id, grupos_servicio(nombre), servicios(nombre)")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const fila = data as unknown as {
    grupos_servicio: { nombre: string } | null
    servicios: { nombre: string } | null
  }
  return {
    agrupador: fila.grupos_servicio?.nombre?.trim() || null,
    especialidad: fila.servicios?.nombre?.trim() || null,
  }
}
