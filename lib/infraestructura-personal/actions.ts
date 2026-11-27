"use server";

import { obtenerServiciosFrecuencia } from "@/lib/infraestructura-personal/queries";

export async function obtenerServiciosFrecuenciaAction(
  frecuenciaId: string
): Promise<Record<string, number>> {
  return await obtenerServiciosFrecuencia(frecuenciaId);
}
