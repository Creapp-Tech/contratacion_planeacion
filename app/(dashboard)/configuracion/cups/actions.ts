"use server"

import { revalidatePath } from "next/cache"
import { requireSuperadmin } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { cupsSchema, type CupsInput } from "@/lib/validations/cups"

export type CupsActionResult = { success: true } | { error: string }

const CUPS_PATH = "/configuracion/cups"

export async function crearCups(input: CupsInput): Promise<CupsActionResult> {
  await requireSuperadmin()

  const parsed = cupsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  // Verificar unicidad código + versión
  const existente = await createAdminClient()
    .from("cups")
    .select("id")
    .eq("codigo", parsed.data.codigo)
    .eq("version_resolucion", parsed.data.version_resolucion)
    .maybeSingle()

  if (existente.data) {
    return { error: "Ya existe un CUPS con ese código y versión de resolución." }
  }

  const { error } = await createAdminClient()
    .from("cups")
    .insert({
      ...parsed.data,
      codigo: parsed.data.codigo,
    })

  if (error) return { error: error.message }

  revalidatePath(CUPS_PATH)
  return { success: true }
}

export async function actualizarCups(id: string, input: CupsInput): Promise<CupsActionResult> {
  await requireSuperadmin()

  const parsed = cupsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { error } = await createAdminClient()
    .from("cups")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(CUPS_PATH)
  return { success: true }
}

export async function eliminarCups(id: string): Promise<CupsActionResult> {
  await requireSuperadmin()

  const { error } = await createAdminClient()
    .from("cups")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(CUPS_PATH)
  return { success: true }
}

export async function importarCups(
  filas: any[]
): Promise<
  | { success: true; insertadas: number; actualizadas: number; omitidas: { fila: number; motivo: string }[] }
  | { error: string }
> {
  await requireSuperadmin()

  const omitidas: { fila: number; motivo: string }[] = []
  const payload: any[] = []
  const actualizaciones: { id: string; [key: string]: any }[] = []

  // Cargar existentes para detectar duplicados por código + versión
  const existentesRes = await createAdminClient()
    .from("cups")
    .select("id, codigo, version_resolucion")

  if (existentesRes.error) {
    return { error: "No se pudo cargar los CUPS existentes." }
  }

  const mapaExistentes = new Map(
    (existentesRes.data ?? []).map((c: any) => [
      `${c.codigo?.trim().toLowerCase()}|${c.version_resolucion?.trim().toLowerCase()}`,
      c.id,
    ])
  )

  // Cargar grupos y servicios para validación
  const [gruposRes, serviciosRes] = await Promise.all([
    createAdminClient().from("grupos_servicio").select("id, nombre").eq("activo", true),
    createAdminClient().from("servicios").select("id, nombre, grupo_id").eq("activo", true),
  ])

  if (gruposRes.error) return { error: "No se pudo cargar los grupos de servicio." }
  if (serviciosRes.error) return { error: "No se pudo cargar los servicios." }

  const mapaGrupos = new Map(
    (gruposRes.data ?? []).map((g: any) => [g.nombre?.trim().toLowerCase(), g.id])
  )

  const mapaServicios = new Map(
    (serviciosRes.data ?? []).map((s: any) => [s.nombre?.trim().toLowerCase(), s])
  )

  const vistos = new Set<string>()

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2
    const fila = filas[i]

    const codigo = String(fila.codigo ?? "").trim()
    const descripcion = String(fila.descripcion ?? "").trim()
    const grupoNombre = String(fila.grupo ?? fila.grupo_servicio ?? "").trim()
    const servicioNombre = String(fila.servicio ?? "").trim()
    const seccion = String(fila.seccion ?? "").trim()
    const version = String(fila.version_resolucion ?? "").trim()
    const fechaInicio = String(fila.fecha_inicio ?? "").trim()
    const fechaFin = String(fila.fecha_fin ?? "").trim()
    const activo = String(fila.activo ?? "true").trim().toLowerCase()

    if (!codigo) {
      omitidas.push({ fila: numeroFila, motivo: "Falta el código" })
      continue
    }
    if (!/^\d{6}$/.test(codigo)) {
      omitidas.push({ fila: numeroFila, motivo: "El código debe tener 6 dígitos" })
      continue
    }
    if (!descripcion) {
      omitidas.push({ fila: numeroFila, motivo: "Falta la descripción" })
      continue
    }
    if (!seccion) {
      omitidas.push({ fila: numeroFila, motivo: "Falta la sección" })
      continue
    }
    if (!version) {
      omitidas.push({ fila: numeroFila, motivo: "Falta la versión de resolución" })
      continue
    }
    if (!fechaInicio) {
      omitidas.push({ fila: numeroFila, motivo: "Falta la fecha de inicio de vigencia" })
      continue
    }

    let grupoId: string | null = null
    if (grupoNombre) {
      const gid = mapaGrupos.get(grupoNombre.toLowerCase())
      if (!gid) {
        omitidas.push({ fila: numeroFila, motivo: `Grupo no encontrado: ${grupoNombre}` })
        continue
      }
      grupoId = gid
    }

    let servicioId: string | null = null
    if (servicioNombre) {
      const svc = mapaServicios.get(servicioNombre.toLowerCase())
      if (!svc) {
        omitidas.push({ fila: numeroFila, motivo: `Servicio no encontrado: ${servicioNombre}` })
        continue
      }
      // Si hay grupo, verificar que el servicio pertenezca a ese grupo
      if (grupoId && (svc as any).grupo_id !== grupoId) {
        omitidas.push({
          fila: numeroFila,
          motivo: `El servicio "${servicioNombre}" no pertenece al grupo "${grupoNombre}"`,
        })
        continue
      }
      servicioId = (svc as any).id
    }

    const clave = `${codigo.toLowerCase()}|${version.toLowerCase()}`

    if (vistos.has(clave)) {
      omitidas.push({ fila: numeroFila, motivo: "Código y versión repetidos en el archivo" })
      continue
    }
    vistos.add(clave)

    const registro: any = {
      codigo,
      descripcion,
      grupo_id: grupoId,
      servicio_id: servicioId,
      seccion,
      version_resolucion: version,
      fecha_inicio: fechaInicio,
      activo: activo !== "false",
    }

    if (fechaFin) {
      registro.fecha_fin = fechaFin
    }

    const idExistente = mapaExistentes.get(clave)
    if (idExistente) {
      actualizaciones.push({ id: idExistente, ...registro })
    } else {
      payload.push(registro)
    }
  }

  if (payload.length > 0) {
    const { error } = await createAdminClient().from("cups").insert(payload)
    if (error) return { error: error.message }
  }

  for (const actualizacion of actualizaciones) {
    const { id, ...datos } = actualizacion
    const { error } = await createAdminClient()
      .from("cups")
      .update(datos)
      .eq("id", id)
    if (error) return { error: error.message }
  }

  revalidatePath(CUPS_PATH)
  return {
    success: true,
    insertadas: payload.length,
    actualizadas: actualizaciones.length,
    omitidas,
  }
}

// Server action para obtener servicios filtrados por grupo (uso en cliente)
export async function obtenerServiciosPorGrupo(grupoId: string): Promise<
  | { success: true; servicios: { id: string; nombre: string }[] }
  | { error: string }
> {
  await requireSuperadmin()

  const { data, error } = await createAdminClient()
    .from("servicios")
    .select("id, nombre")
    .eq("activo", true)
    .eq("grupo_id", grupoId)
    .order("nombre", { ascending: true })

  if (error) return { error: error.message }

  return { success: true, servicios: (data ?? []) as { id: string; nombre: string }[] }
}

// Server action para obtener grupos de servicio (uso en cliente)
export async function obtenerGruposServicio(): Promise<
  | { success: true; grupos: { id: string; nombre: string }[] }
  | { error: string }
> {
  await requireSuperadmin()

  const { data, error } = await createAdminClient()
    .from("grupos_servicio")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) return { error: error.message }

  return { success: true, grupos: (data ?? []) as { id: string; nombre: string }[] }
}
