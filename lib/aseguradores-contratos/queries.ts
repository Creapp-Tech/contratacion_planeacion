import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { TAMANO_PAGINA, TAMANO_PAGINA_MAX } from "@/lib/aseguradores-contratos/constantes"
import type {
  AseguradoresContratosFiltros,
  ContratoOpcion,
  EspecialistaOpcion,
  ListaResultado,
  OpcionesAseguradoresContratos,
  ResumenAseguradoresContratos,
  ServicioCupsListaFila,
  ServicioCupsRow,
} from "@/lib/aseguradores-contratos/types"

type AdminClient = ReturnType<typeof createAdminClient>

type ContratoCrudo = {
  id: string
  asegurador_id: string
  numero_contrato: string
  nombre: string
  estado: string
  regionales: { nombre: string } | null
  contrato_regionales: { regionales: { nombre: string } | null }[] | null
}

const CAMPOS_SERVICIO =
  "id, asegurador_id, contrato_id, cups_asegurador, cups_id, frecuencia_uso_contratada, cme_contratado, primera_opcion_especialista_id, segunda_opcion_especialista_id, created_by, updated_by, created_at, updated_at"

const CAMPOS_CONTRATO =
  "id, asegurador_id, numero_contrato, nombre, estado, regionales!contratos_regional_id_fkey(nombre), contrato_regionales(regionales(nombre))"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function limpiar(texto: string) {
  return texto
    .trim()
    .replace(/[,()\\*'"]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80)
}

function mismoNombre(a: string | null | undefined, b: string | undefined) {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function regionalesDeContrato(contrato: ContratoCrudo): string[] {
  return [
    ...new Set(
      [
        contrato.regionales?.nombre,
        ...(contrato.contrato_regionales ?? []).map(
          (item) => item.regionales?.nombre
        ),
      ]
        .map((nombre) => nombre?.trim())
        .filter((nombre): nombre is string => Boolean(nombre))
    ),
  ].sort((a, b) => a.localeCompare(b, "es"))
}

async function contratosConRegionales(
  admin: AdminClient,
  ids?: string[]
): Promise<ContratoCrudo[]> {
  let query = admin.from("contratos").select(CAMPOS_CONTRATO)
  if (ids) {
    if (ids.length === 0) return []
    query = query.in("id", ids)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as ContratoCrudo[]
}

/** Ids de contratos visibles para la regional del usuario. `null` = todos. */
async function contratosPorRegional(
  admin: AdminClient,
  regional: string | null | undefined
): Promise<string[] | null> {
  if (!regional) return null
  const contratos = await contratosConRegionales(admin)
  return contratos
    .filter((contrato) =>
      regionalesDeContrato(contrato).some((nombre) =>
        mismoNombre(nombre, regional)
      )
    )
    .map((contrato) => contrato.id)
}

async function idsPorBusqueda(
  admin: AdminClient,
  termino: string
): Promise<string[] | null> {
  const limpio = limpiar(termino)
  if (!limpio) return null

  const [contratosRes, cupsRes, serviciosRes] = await Promise.all([
    admin
      .from("contratos")
      .select("id")
      .or(`numero_contrato.ilike.*${limpio}*,nombre.ilike.*${limpio}*`),
    admin
      .from("cups")
      .select("id")
      .or(`codigo.ilike.*${limpio}*,nombre.ilike.*${limpio}*`),
    admin
      .from("servicios_cups_aseguradores")
      .select("id")
      .ilike("cups_asegurador", `%${limpio}%`),
  ])

  if (contratosRes.error) throw contratosRes.error
  if (cupsRes.error) throw cupsRes.error
  if (serviciosRes.error) throw serviciosRes.error

  const ids = [
    ...(serviciosRes.data ?? []).map((fila) => fila.id as string),
  ]

  const idsContratos = (contratosRes.data ?? []).map((fila) => fila.id as string)
  const idsCups = (cupsRes.data ?? []).map((fila) => fila.id as string)

  const [porContrato, porCups] = await Promise.all([
    idsContratos.length
      ? admin
          .from("servicios_cups_aseguradores")
          .select("id")
          .in("contrato_id", idsContratos)
      : Promise.resolve({ data: [], error: null }),
    idsCups.length
      ? admin
          .from("servicios_cups_aseguradores")
          .select("id")
          .in("cups_id", idsCups)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (porContrato.error) throw porContrato.error
  if (porCups.error) throw porCups.error
  ids.push(
    ...(porContrato.data ?? []).map((fila) => fila.id as string),
    ...(porCups.data ?? []).map((fila) => fila.id as string)
  )

  return [...new Set(ids)]
}

async function idsFiltrados(
  admin: AdminClient,
  filtros: AseguradoresContratosFiltros,
  regional?: string | null
): Promise<string[]> {
  const [permitidos, busqueda] = await Promise.all([
    contratosPorRegional(admin, regional),
    filtros.q ? idsPorBusqueda(admin, filtros.q) : Promise.resolve(null),
  ])

  if (permitidos?.length === 0) return []

  let query = admin.from("servicios_cups_aseguradores").select("id")

  if (permitidos) query = query.in("contrato_id", permitidos)
  if (busqueda) {
    if (busqueda.length === 0) return []
    query = query.in("id", busqueda)
  }
  if (filtros.aseguradorId && UUID_RE.test(filtros.aseguradorId)) {
    query = query.eq("asegurador_id", filtros.aseguradorId)
  }
  if (filtros.contratoId && UUID_RE.test(filtros.contratoId)) {
    query = query.eq("contrato_id", filtros.contratoId)
  }
  if (filtros.cupsId && UUID_RE.test(filtros.cupsId)) {
    query = query.eq("cups_id", filtros.cupsId)
  }
  if (filtros.opcionId && UUID_RE.test(filtros.opcionId)) {
    query = query.or(
      `primera_opcion_especialista_id.eq.${filtros.opcionId},segunda_opcion_especialista_id.eq.${filtros.opcionId}`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((fila) => fila.id as string)
}

async function getIdViva1a(admin: AdminClient): Promise<string | null> {
  const { data, error } = await admin
    .from("especialistas")
    .select("id")
    .eq("tipo_identificacion", "NIT")
    .eq("estado", "activo")
    .ilike("numero_identificacion", "VIVA1A")
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as { id: string } | null)?.id ?? null
}

/** El id del especialista centinela VIVA1A, resuelto desde la base de datos. */
export async function idEspecialistaViva1a(): Promise<string | null> {
  return getIdViva1a(createAdminClient())
}

async function mapearFilas(
  admin: AdminClient,
  filas: ServicioCupsRow[]
): Promise<ServicioCupsListaFila[]> {
  if (filas.length === 0) return []

  const idsAseguradores = [
    ...new Set(filas.map((fila) => fila.asegurador_id)),
  ]
  const idsContratos = [...new Set(filas.map((fila) => fila.contrato_id))]
  const idsCups = [
    ...new Set(filas.map((fila) => fila.cups_id).filter((id): id is string => Boolean(id))),
  ]
  const idsEspecialistas = [
    ...new Set(
      filas.flatMap((fila) =>
        [fila.primera_opcion_especialista_id, fila.segunda_opcion_especialista_id].filter(
          (id): id is string => Boolean(id)
        )
      )
    ),
  ]

  const [aseguradoresRes, contratos, cupsRes, especialistasRes, viva1aId] =
    await Promise.all([
      admin
        .from("aseguradores_eps")
        .select("id, nombre_eps")
        .in("id", idsAseguradores),
      contratosConRegionales(admin, idsContratos),
      idsCups.length
        ? admin.from("cups").select("id, codigo, nombre").in("id", idsCups)
        : Promise.resolve({ data: [], error: null }),
      idsEspecialistas.length
        ? admin
            .from("especialistas")
            .select("id, numero_identificacion, nombre_completo")
            .in("id", idsEspecialistas)
        : Promise.resolve({ data: [], error: null }),
      getIdViva1a(admin),
    ])

  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (cupsRes.error) throw cupsRes.error
  if (especialistasRes.error) throw especialistasRes.error

  const aseguradores = new Map(
    (aseguradoresRes.data ?? []).map((fila) => [
      fila.id as string,
      fila.nombre_eps as string,
    ])
  )
  const contratosMap = new Map(
    contratos.map((contrato) => [contrato.id, contrato])
  )
  const cups = new Map(
    (cupsRes.data ?? []).map((fila) => [
      fila.id as string,
      {
        id: fila.id as string,
        codigo: fila.codigo as string,
        nombre: (fila.nombre as string | null) ?? null,
      },
    ])
  )
  const especialistas = new Map<string, EspecialistaOpcion>(
    (especialistasRes.data ?? []).map((fila) => [
      fila.id as string,
      {
        id: fila.id as string,
        numero_identificacion: fila.numero_identificacion as string,
        nombre_completo: fila.nombre_completo as string,
        esViva1a: fila.id === viva1aId,
      },
    ])
  )

  return filas.map((fila) => {
    const contrato = contratosMap.get(fila.contrato_id)
    const etiquetaContrato = contrato
      ? contrato.numero_contrato
        ? `${contrato.numero_contrato} · ${contrato.nombre}`
        : contrato.nombre
      : "Contrato no disponible"

    return {
      ...fila,
      asegurador: aseguradores.get(fila.asegurador_id) ?? "Asegurador no disponible",
      contrato: etiquetaContrato,
      contratoRegionales: contrato ? regionalesDeContrato(contrato) : [],
      cupsResolucion: fila.cups_id ? cups.get(fila.cups_id) ?? null : null,
      primeraOpcion: fila.primera_opcion_especialista_id
        ? especialistas.get(fila.primera_opcion_especialista_id) ?? null
        : null,
      segundaOpcion: fila.segunda_opcion_especialista_id
        ? especialistas.get(fila.segunda_opcion_especialista_id) ?? null
        : null,
    }
  })
}

export async function listServiciosCups(
  filtros: AseguradoresContratosFiltros = {},
  regional?: string | null
): Promise<ListaResultado<ServicioCupsListaFila>> {
  const admin = createAdminClient()
  const pageSize = Math.min(
    Math.max(Math.trunc(filtros.pageSize ?? TAMANO_PAGINA), 1),
    TAMANO_PAGINA_MAX
  )
  const page = Math.max(Math.trunc(filtros.page ?? 1), 1)
  const vacio = { rows: [], total: 0, page, pageSize }

  const ids = await idsFiltrados(admin, filtros, regional)
  if (ids.length === 0) return vacio

  const desde = (page - 1) * pageSize
  const { data, error, count } = await admin
    .from("servicios_cups_aseguradores")
    .select(CAMPOS_SERVICIO, { count: "exact" })
    .in("id", ids)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(desde, desde + pageSize - 1)

  if (error) throw error
  return {
    rows: await mapearFilas(admin, (data ?? []) as ServicioCupsRow[]),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getServicioCups(
  id: string
): Promise<ServicioCupsListaFila | null> {
  if (!UUID_RE.test(id)) return null
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("servicios_cups_aseguradores")
    .select(CAMPOS_SERVICIO)
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const [fila] = await mapearFilas(admin, [data as ServicioCupsRow])
  return fila ?? null
}

export async function getServicioParaPermisos(id: string): Promise<{
  id: string
  contrato_id: string
  asegurador_id: string
  created_by: string | null
} | null> {
  if (!UUID_RE.test(id)) return null
  const { data, error } = await createAdminClient()
    .from("servicios_cups_aseguradores")
    .select("id, contrato_id, asegurador_id, created_by")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    contrato_id: string
    asegurador_id: string
    created_by: string | null
  } | null
}

/** Regionales del contrato, tanto la principal como las adicionales. */
export async function regionalesDelContrato(
  id: string
): Promise<string[]> {
  const contratos = await contratosConRegionales(createAdminClient(), [id])
  return contratos[0] ? regionalesDeContrato(contratos[0]) : []
}

export async function listOpcionesAseguradoresContratos(): Promise<OpcionesAseguradoresContratos> {
  const admin = createAdminClient()
  const [aseguradoresRes, contratos, especialistasRes, viva1aId] = await Promise.all([
    admin
      .from("aseguradores_eps")
      .select("id, nombre_eps, estado")
      .eq("estado", "activo")
      .order("nombre_eps", { ascending: true }),
    contratosConRegionales(admin),
    admin
      .from("especialistas")
      .select("id, numero_identificacion, nombre_completo, estado")
      .eq("estado", "activo")
      .order("nombre_completo", { ascending: true }),
    getIdViva1a(admin),
  ])

  if (aseguradoresRes.error) throw aseguradoresRes.error
  if (especialistasRes.error) throw especialistasRes.error

  const contratosOpcion: ContratoOpcion[] = contratos
    .map((contrato) => ({
      id: contrato.id,
      asegurador_id: contrato.asegurador_id,
      numero_contrato: contrato.numero_contrato,
      nombre: contrato.nombre,
      estado: contrato.estado,
      regionales: regionalesDeContrato(contrato),
    }))
    .sort((a, b) =>
      `${a.numero_contrato} ${a.nombre}`.localeCompare(
        `${b.numero_contrato} ${b.nombre}`,
        "es"
      )
    )

  const especialistas: EspecialistaOpcion[] = (
    especialistasRes.data ?? []
  ).map((fila) => ({
    id: fila.id as string,
    numero_identificacion: fila.numero_identificacion as string,
    nombre_completo: fila.nombre_completo as string,
    esViva1a: fila.id === viva1aId,
  }))

  return {
    aseguradores: (aseguradoresRes.data ?? []).map((fila) => ({
      id: fila.id as string,
      nombre: fila.nombre_eps as string,
    })),
    contratos: contratosOpcion,
    especialistas,
    viva1aId,
  }
}

export async function resumenServiciosCups(
  regional?: string | null
): Promise<ResumenAseguradoresContratos> {
  const vacio: ResumenAseguradoresContratos = {
    servicios: 0,
    contratos: 0,
    aseguradores: 0,
    conCupsResolucion: 0,
    cmePromedio: 0,
  }
  const admin = createAdminClient()
  const ids = await idsFiltrados(admin, {}, regional)
  if (ids.length === 0) return vacio

  const { data, error } = await admin
    .from("servicios_cups_aseguradores")
    .select(
      "asegurador_id, contrato_id, cups_id, cme_contratado"
    )
    .in("id", ids)
  if (error) throw error

  const filas = (data ?? []) as {
    asegurador_id: string
    contrato_id: string
    cups_id: string | null
    cme_contratado: number | string
  }[]
  const totalCme = filas.reduce(
    (suma, fila) => suma + Number(fila.cme_contratado || 0),
    0
  )

  return {
    servicios: filas.length,
    contratos: new Set(filas.map((fila) => fila.contrato_id)).size,
    aseguradores: new Set(filas.map((fila) => fila.asegurador_id)).size,
    conCupsResolucion: filas.filter((fila) => Boolean(fila.cups_id)).length,
    cmePromedio: filas.length ? totalCme / filas.length : 0,
  }
}
