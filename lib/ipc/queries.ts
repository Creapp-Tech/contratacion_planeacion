import { ESTADO_EJECUCION_EN_EJECUCION } from "@/lib/contratos/constantes"
import {
  ANIO_IPC_MAX,
  ANIO_IPC_MIN,
  PAIS_IPC_COMPARACION,
  compararIpc,
  type EstadoIpc,
} from "@/lib/ipc/constantes"
import { createAdminClient } from "@/lib/supabase/admin"

const CAMPOS_IPC = `
  id,
  contrato_id,
  anio,
  costo_usuario,
  upc,
  upc_subsidiado,
  porcentaje_ipc,
  created_at,
  contratos!inner(
    id,
    nombre,
    numero_contrato,
    asegurador_id,
    regional_id,
    estado,
    estado_ejecucion:catalogos_opciones!contratos_estado_ejecucion_id_fkey(nombre),
    aseguradores_eps(nombre_eps),
    regionales(nombre)
  )
`

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esUuid(value: string | undefined | null): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

export type AlcanceIpcQuery = {
  verTodo: boolean
  regionalId: string | null
}

export type IpcFiltros = {
  regional?: string
  contrato?: string
  asegurador?: string
  anio?: string
}

export type ContratoIpc = {
  id: string
  nombre: string
  numero_contrato: string
  asegurador_id: string
  regional_id: string
  estado: string
  estado_ejecucion: { nombre: string } | null
  aseguradores_eps: { nombre_eps: string } | null
  regionales: { nombre: string } | null
}

export type IpcRow = {
  id: string
  contrato_id: string
  anio: number
  costo_usuario: number
  upc: number
  upc_subsidiado: number
  porcentaje_ipc: number
  created_at: string
  contratos: ContratoIpc
}

export type IpcConReferencia = IpcRow & {
  ipc_nacional: number | null
  diferencia: number | null
  estado: EstadoIpc
}

export type OpcionesIpc = {
  regionales: { id: string; nombre: string }[]
  aseguradores: { id: string; nombre: string }[]
  contratos: {
    id: string
    numero_contrato: string
    nombre: string
    asegurador_id: string
  }[]
  anios: number[]
}

export type ContratoIpcOpcion = {
  id: string
  nombre: string
  numero_contrato: string
  asegurador_id: string
  asegurador_nombre: string
  regional_id: string
  estado_ejecucion: string | null
  en_ejecucion: boolean
}

export type IpcNacionalRow = {
  id: string
  pais: string
  anio: number
  porcentaje_ipc: number
  valor_upc_contributivo: number
  valor_upc_subsidiado: number | null
  created_at: string
  updated_at: string
}

export type IpcNacionalReferencia = {
  anio: number
  porcentaje_ipc: number
}

function normalizarFila(fila: IpcRow): IpcRow {
  return {
    ...fila,
    anio: Number(fila.anio),
    costo_usuario: Number(fila.costo_usuario),
    upc: Number(fila.upc),
    upc_subsidiado: Number(fila.upc_subsidiado),
    porcentaje_ipc: Number(fila.porcentaje_ipc),
  }
}

async function mapaNacional(anios: number[]): Promise<Map<number, number>> {
  const unicos = [...new Set(anios)]
  if (unicos.length === 0) return new Map()

  const { data, error } = await createAdminClient()
    .from("ipc_nacional")
    .select("anio, porcentaje_ipc")
    .eq("pais", PAIS_IPC_COMPARACION)
    .in("anio", unicos)

  if (error) throw error

  return new Map(
    ((data ?? []) as { anio: number; porcentaje_ipc: number }[]).map((fila) => [
      Number(fila.anio),
      Number(fila.porcentaje_ipc),
    ])
  )
}

function enriquecer(
  fila: IpcRow,
  nacionalPorAnio: Map<number, number>
): IpcConReferencia {
  const nacional = nacionalPorAnio.get(fila.anio) ?? null
  const diferencia =
    nacional == null
      ? null
      : Math.round((fila.porcentaje_ipc - nacional) * 1000) / 1000

  return {
    ...fila,
    ipc_nacional: nacional,
    diferencia,
    estado: compararIpc(fila.porcentaje_ipc, nacional),
  }
}

export async function listIpc(
  filtros: IpcFiltros,
  alcance: AlcanceIpcQuery
): Promise<IpcConReferencia[]> {
  const admin = createAdminClient()

  let query = admin.from("ipc_seguimiento").select(CAMPOS_IPC)

  // Los contratos eliminados lógicamente no aparecen en el dashboard.
  query = query.eq("contratos.estado", "activo")

  if (!alcance.verTodo) {
    if (!alcance.regionalId) return []
    query = query.eq("contratos.regional_id", alcance.regionalId)
  } else if (esUuid(filtros.regional)) {
    query = query.eq("contratos.regional_id", filtros.regional)
  }

  if (esUuid(filtros.asegurador)) {
    query = query.eq("contratos.asegurador_id", filtros.asegurador)
  }

  if (esUuid(filtros.contrato)) {
    query = query.eq("contrato_id", filtros.contrato)
  }

  const anio = Number(filtros.anio)
  if (
    Number.isInteger(anio) &&
    anio >= ANIO_IPC_MIN &&
    anio <= ANIO_IPC_MAX
  ) {
    query = query.eq("anio", anio)
  }

  const { data, error } = await query

  if (error) throw error

  const filas = ((data ?? []) as unknown as IpcRow[]).map(normalizarFila)
  const nacionalPorAnio = await mapaNacional(filas.map((fila) => fila.anio))

  return filas
    .map((fila) => enriquecer(fila, nacionalPorAnio))
    .sort(
      (a, b) =>
        b.anio - a.anio ||
        a.contratos.numero_contrato.localeCompare(
          b.contratos.numero_contrato,
          "es"
        )
    )
}

export async function listOpcionesIpc(
  alcance: AlcanceIpcQuery
): Promise<OpcionesIpc> {
  const filas = await listIpc({}, alcance)

  const regionales = new Map<string, string>()
  const aseguradores = new Map<string, string>()
  const contratos = new Map<string, OpcionesIpc["contratos"][number]>()
  const anios = new Set<number>()

  for (const fila of filas) {
    const contrato = fila.contratos

    if (contrato.regionales?.nombre) {
      regionales.set(contrato.regional_id, contrato.regionales.nombre)
    }

    if (contrato.aseguradores_eps?.nombre_eps) {
      aseguradores.set(
        contrato.asegurador_id,
        contrato.aseguradores_eps.nombre_eps
      )
    }

    contratos.set(contrato.id, {
      id: contrato.id,
      numero_contrato: contrato.numero_contrato,
      nombre: contrato.nombre,
      asegurador_id: contrato.asegurador_id,
    })

    anios.add(fila.anio)
  }

  return {
    regionales: [...regionales.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    aseguradores: [...aseguradores.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    contratos: [...contratos.values()].sort((a, b) =>
      a.numero_contrato.localeCompare(b.numero_contrato, "es")
    ),
    anios: [...anios].sort((a, b) => b - a),
  }
}

export async function listContratosIpc(
  alcance: AlcanceIpcQuery
): Promise<ContratoIpcOpcion[]> {
  const admin = createAdminClient()

  let query = admin
    .from("contratos")
    .select(
      `id, nombre, numero_contrato, asegurador_id, regional_id,
       estado_ejecucion:catalogos_opciones!contratos_estado_ejecucion_id_fkey(nombre),
       aseguradores_eps(nombre_eps)`
    )
    .eq("estado", "activo")

  if (!alcance.verTodo) {
    if (!alcance.regionalId) return []
    query = query.eq("regional_id", alcance.regionalId)
  }

  const { data, error } = await query.order("numero_contrato", {
    ascending: true,
  })

  if (error) throw error

  const filas = (data ?? []) as unknown as {
    id: string
    nombre: string
    numero_contrato: string
    asegurador_id: string
    regional_id: string
    estado_ejecucion: { nombre: string } | null
    aseguradores_eps: { nombre_eps: string } | null
  }[]

  return filas.map((fila) => {
    const estadoEjecucion = fila.estado_ejecucion?.nombre ?? null

    return {
      id: fila.id,
      nombre: fila.nombre,
      numero_contrato: fila.numero_contrato,
      asegurador_id: fila.asegurador_id,
      asegurador_nombre: fila.aseguradores_eps?.nombre_eps ?? "—",
      regional_id: fila.regional_id,
      estado_ejecucion: estadoEjecucion,
      en_ejecucion: estadoEjecucion === ESTADO_EJECUCION_EN_EJECUCION,
    }
  })
}

export async function getIpcRegistro(
  id: string,
  alcance: AlcanceIpcQuery
): Promise<IpcConReferencia | null> {
  if (!esUuid(id)) return null

  const { data, error } = await createAdminClient()
    .from("ipc_seguimiento")
    .select(CAMPOS_IPC)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const fila = normalizarFila(data as unknown as IpcRow)

  if (fila.contratos.estado !== "activo") return null

  if (!alcance.verTodo && fila.contratos.regional_id !== alcance.regionalId) {
    return null
  }

  const nacionalPorAnio = await mapaNacional([fila.anio])
  return enriquecer(fila, nacionalPorAnio)
}

export async function listIpcNacional(): Promise<IpcNacionalRow[]> {
  const { data, error } = await createAdminClient()
    .from("ipc_nacional")
    .select(
      "id, pais, anio, porcentaje_ipc, valor_upc_contributivo, valor_upc_subsidiado, created_at, updated_at"
    )
    .order("pais", { ascending: true })
    .order("anio", { ascending: false })

  if (error) throw error

  return ((data ?? []) as IpcNacionalRow[]).map((fila) => ({
    ...fila,
    anio: Number(fila.anio),
    porcentaje_ipc: Number(fila.porcentaje_ipc),
    valor_upc_contributivo: Number(fila.valor_upc_contributivo),
    valor_upc_subsidiado:
      fila.valor_upc_subsidiado == null
        ? null
        : Number(fila.valor_upc_subsidiado),
  }))
}

export async function getIpcNacional(
  id: string
): Promise<IpcNacionalRow | null> {
  if (!esUuid(id)) return null

  const { data, error } = await createAdminClient()
    .from("ipc_nacional")
    .select(
      "id, pais, anio, porcentaje_ipc, valor_upc_contributivo, valor_upc_subsidiado, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const fila = data as IpcNacionalRow

  return {
    ...fila,
    anio: Number(fila.anio),
    porcentaje_ipc: Number(fila.porcentaje_ipc),
    valor_upc_contributivo: Number(fila.valor_upc_contributivo),
    valor_upc_subsidiado:
      fila.valor_upc_subsidiado == null
        ? null
        : Number(fila.valor_upc_subsidiado),
  }
}

export async function listIpcNacionalReferencia(): Promise<
  IpcNacionalReferencia[]
> {
  const { data, error } = await createAdminClient()
    .from("ipc_nacional")
    .select("anio, porcentaje_ipc")
    .eq("pais", PAIS_IPC_COMPARACION)
    .order("anio", { ascending: true })

  if (error) throw error

  return (
    (data ?? []) as { anio: number; porcentaje_ipc: number }[]
  ).map((fila) => ({
    anio: Number(fila.anio),
    porcentaje_ipc: Number(fila.porcentaje_ipc),
  }))
}
