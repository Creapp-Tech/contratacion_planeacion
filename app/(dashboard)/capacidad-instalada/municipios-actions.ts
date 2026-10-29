"use server"

import { createClient } from "@/lib/supabase/server"

export async function obtenerMunicipiosPorDepartamento(departamento: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sedes")
      .select("municipio")
      .eq("departamento", departamento)

    if (error) {
      return { ok: false, error: error.message }
    }

    const municipios = [
      ...new Set((data ?? []).map((f) => f.municipio).filter(Boolean) as string[]),
    ]
    return { ok: true, data: municipios }
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al obtener municipios" }
  }
}
