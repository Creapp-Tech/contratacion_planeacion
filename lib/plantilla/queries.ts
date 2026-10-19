export async function listPlantilla(filtros: { q?: string } = {}) {
  // Este es un placeholder - en un proyecto real tendría la tabla real
  // import { supabaseAdmin } from "@/lib/supabase/admin"
  
  // Por ahora retornamos datos de ejemplo estructurados
  return [
    { id: "1", nombre: "Ejemplo 1", descripcion: "Esta es una plantilla" },
    { id: "2", nombre: "Ejemplo 2", descripcion: "Módulo de ejemplo" },
  ]
}