import { createAdminClient } from "@/lib/supabase/admin";
import type { FrecuenciaReferenciaOpcion } from "./types";

/**
 * Carga únicamente las frecuencias marcadas/clasificadas como NOTA TECNICA
 * (tipo_frecuencia = 'nota_tecnica_viva') desde el repositorio de frecuencias existente.
 */
export async function listFrecuenciasNotaTecnica(): Promise<
  FrecuenciaReferenciaOpcion[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("frecuencias")
    .select(
      "id, nombre_nota_tecnica, version, sedes(nombre, regional, zonal), regimenes(nombre), aseguradores_eps(nombre_eps)"
    )
    .eq("tipo_frecuencia", "nota_tecnica_viva")
    .eq("activo", true)
    .order("nombre_nota_tecnica", { ascending: true })
    .order("version", { ascending: true });

  if (error) {
    console.warn(
      "[infraestructura-personal] listFrecuenciasNotaTecnica:",
      error.message
    );
    return [];
  }

  return ((data ?? []) as unknown as {
    id: string;
    nombre_nota_tecnica: string;
    version: string;
    sedes: { nombre: string; regional: string | null; zonal: string | null } | null;
    regimenes: { nombre: string } | null;
    aseguradores_eps: { nombre_eps: string } | null;
  }[]).map((fila) => ({
    id: fila.id,
    nombre: `${fila.nombre_nota_tecnica} · v${fila.version}`,
    sede_nombre: fila.sedes?.nombre ?? "—",
    regional: fila.sedes?.regional ?? null,
    zonal: fila.sedes?.zonal ?? null,
    regimen_nombre: fila.regimenes?.nombre ?? "—",
    asegurador_nombre: fila.aseguradores_eps?.nombre_eps ?? "—",
    version: fila.version,
  }));
}

/**
 * Obtiene los valores de frecuencia por servicio de una frecuencia de referencia,
 * para precargar editables en la conformación de servicios.
 * Devuelve un mapa { [servicio_id]: frecuencia }.
 */
export async function obtenerServiciosFrecuencia(
  frecuenciaId: string
): Promise<Record<string, number>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("frecuencias_servicios")
    .select("servicio_id, frecuencia")
    .eq("frecuencia_id", frecuenciaId);

  if (error) {
    console.warn(
      "[infraestructura-personal] obtenerServiciosFrecuencia:",
      error.message
    );
    return {};
  }

  const mapa: Record<string, number> = {};
  for (const fila of (data ?? []) as { servicio_id: string; frecuencia: number }[]) {
    mapa[fila.servicio_id] = fila.frecuencia;
  }
  return mapa;
}
