"use server";

import { requireEditorPlaneacion } from "@/lib/auth/session";
import {
  listAseguradores,
  listSedesOpciones,
  listOpcionesCatalogo,
} from "@/lib/sedes/queries";
import { listRegimenes } from "@/lib/regimenes/queries";
import { listServiciosAgrupados } from "@/lib/servicios/queries";
import { listFrecuenciasNotaTecnica } from "@/lib/infraestructura-personal/queries";
import type { InfraestructuraPersonalOpciones } from "@/lib/infraestructura-personal/types";

import { InfraestructuraPersonalForm } from "./infraestructura-personal-form";

export async function InfraestructuraPersonalNuevoContenido() {
  await requireEditorPlaneacion();

  const [
    aseguradores,
    regímenes,
    catalogo,
    sedes,
    serviciosAgrupados,
    frecuenciasNotaTecnica,
  ] = await Promise.all([
    listAseguradores(),
    listRegimenes(),
    listOpcionesCatalogo(),
    listSedesOpciones(),
    listServiciosAgrupados(),
    listFrecuenciasNotaTecnica(),
  ]);

  const opciones: InfraestructuraPersonalOpciones = {
    aseguradores: aseguradores.map((a) => ({
      id: a.id,
      nombre: a.nombre_eps,
    })),
    regímenes: regímenes.map((r) => ({
      id: r.id,
      nombre: r.nombre,
    })),
    regionales: catalogo.regional,
    zonales: catalogo.zonal,
    sedes: sedes.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      regional: s.regional,
      zonal: s.zonal,
    })),
    serviciosAgrupados: serviciosAgrupados.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      orden: g.orden,
      servicios: g.servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        grupo_id: s.grupo_id,
        duracion_minutos: s.duracion_minutos,
        tipo_personal: s.tipo_personal,
        orden: s.orden,
      })),
    })),
    frecuenciasNotaTecnica: frecuenciasNotaTecnica.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      sede_nombre: f.sede_nombre,
      regional: f.regional,
      zonal: f.zonal,
      regimen_nombre: f.regimen_nombre,
      asegurador_nombre: f.asegurador_nombre,
      version: f.version,
    })),
  };

  return <InfraestructuraPersonalForm opciones={opciones} />;
}
