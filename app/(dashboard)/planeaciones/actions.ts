"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const planeacionSchema = z.object({
  regional: z.string().nullish(),
  poblacion: z.coerce.number().nullish(),
  nombre: z.string().min(1, "Nombre requerido"),
  version: z.string().nullish(),
  regimen: z.string().nullish(),
  asegurador: z.string().nullish(),
  tiene_nota_tecnica: z.boolean(),
  frecuencias_referencia: z.array(z.string()),
  servicios_seleccionados: z.array(
    z.object({
      grupo_id: z.string(),
      servicio_id: z.string(),
      valor_frecuencia: z.string().optional(),
      checked: z.boolean(),
    })
  ),
})

export type OpcionSelect = { id: string; nombre: string }

export async function obtenerOpcionesPlaneacion() {
  try {
    const supabase = await createClient()

    const [regionalesRes, regimenesRes, aseguradoresRes] = await Promise.all([
      supabase
        .from("regionales")
        .select("id, nombre")
        .order("nombre", { ascending: true }),
      supabase
        .from("regimenes")
        .select("id, nombre")
        .order("nombre", { ascending: true }),
      supabase
        .from("aseguradores_eps")
        .select("id, nombre_eps")
        .order("nombre_eps", { ascending: true }),
    ])

    const regionales: OpcionSelect[] = (regionalesRes.data ?? []).map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
    }))

    const regimenes: OpcionSelect[] = (regimenesRes.data ?? []).map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
    }))

    const aseguradores: OpcionSelect[] = (aseguradoresRes.data ?? []).map(
      (a: any) => ({
        id: a.id,
        nombre: a.nombre_eps,
      })
    )

    return {
      ok: true,
      data: { regionales, regimenes, aseguradores },
    }
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Error al obtener opciones",
      data: { regionales: [], regimenes: [], aseguradores: [] },
    }
  }
}

export async function obtenerFrecuenciasReferencia() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("frecuencias")
      .select("id, nombre_nota_tecnica, version, tipo_frecuencia")
      .order("nombre_nota_tecnica", { ascending: true })

    if (error) {
      return { ok: false, error: error.message, data: [] }
    }

    const items = (data ?? []).map((f: any) => ({
      id: f.id,
      nombre: [f.nombre_nota_tecnica, f.version ? `v${f.version}` : null]
        .filter(Boolean)
        .join(" "),
      etiqueta: f.nombre_nota_tecnica || f.id,
    }))

    return { ok: true, data: items }
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al obtener frecuencias", data: [] }
  }
}

export async function crearPlaneacion(formData: unknown) {
  try {
    const parsed = planeacionSchema.safeParse(formData)
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("planeaciones")
      .insert({
        regional: parsed.data.regional,
        poblacion: parsed.data.poblacion,
        nombre: parsed.data.nombre,
        version: parsed.data.version,
        regimen: parsed.data.regimen,
        asegurador: parsed.data.asegurador,
        tiene_nota_tecnica: parsed.data.tiene_nota_tecnica,
        frecuencias_referencia: parsed.data.frecuencias_referencia,
        servicios_seleccionados: parsed.data.servicios_seleccionados,
      })
      .select()
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    revalidatePath("/planeaciones")
    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al crear planeación" }
  }
}

export async function obtenerPlaneaciones() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("planeaciones")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al obtener planeaciones" }
  }
}
