import { requireAlcancePlaneacion } from "@/lib/auth/session";
import { puedeEditarPlaneacion } from "@/lib/constants/roles";
import { PLANEACIONES_EJEMPLO } from "@/lib/infraestructura-personal/mock-planaciones";
import type { PlaneacionListaFila } from "@/lib/infraestructura-personal/types";

import { InfraestructuraPersonalFiltros } from "./infraestructura-personal-filtros";
import { InfraestructuraPersonalTabla } from "./infraestructura-personal-tabla";

type OpcionesFiltros = {
  aseguradores: string[];
  regímenes: string[];
  regionales: string[];
  zonales: string[];
  sedes: string[];
  estados: string[];
};

const OPCIONES_VACIAS: OpcionesFiltros = {
  aseguradores: [],
  regímenes: [],
  regionales: [],
  zonales: [],
  sedes: [],
  estados: ["Borrador", "En revisión", "Aprobada"],
};

type Params = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function InfraestructuraPersonalContenido({
  searchParams,
}: Params) {
  const alcance = await requireAlcancePlaneacion();
  const params = await searchParams;

  const filtros = {
    q: pick(params.q),
    asegurador: pick(params.asegurador),
    regimen: pick(params.regimen),
    regional: pick(params.regional),
    zonal: pick(params.zonal),
    estado: pick(params.estado),
    sede: pick(params.sede),
  };

  // Datos de ejemplo (mock). Reemplazar por consulta real a tabla de planeaciones
  // cuando el flujo de persistencia esté confirmado.
  let filas = PLANEACIONES_EJEMPLO;

  if (filtros.q) {
    const q = filtros.q.toLowerCase();
    filas = filas.filter(
      (f) =>
        f.sede.toLowerCase().includes(q) ||
        f.asegurador.toLowerCase().includes(q) ||
        f.regimen.toLowerCase().includes(q)
    );
  }
  if (filtros.asegurador) {
    filas = filas.filter((f) => f.asegurador === filtros.asegurador);
  }
  if (filtros.regimen) {
    filas = filas.filter((f) => f.regimen === filtros.regimen);
  }
  if (filtros.regional) {
    filas = filas.filter((f) => f.regional === filtros.regional);
  }
  if (filtros.zonal) {
    filas = filas.filter((f) => f.zonal === filtros.zonal);
  }
  if (filtros.sede) {
    filas = filas.filter((f) => f.sede === filtros.sede);
  }
  if (filtros.estado) {
    filas = filas.filter((f) => f.estado === filtros.estado);
  }

  const opciones: OpcionesFiltros = {
    aseguradores: [...new Set(filas.map((f) => f.asegurador))].sort(),
    regímenes: [...new Set(filas.map((f) => f.regimen))].sort(),
    regionales: [...new Set(filas.map((f) => f.regional))].sort(),
    zonales: [...new Set(filas.map((f) => f.zonal))].sort(),
    sedes: [...new Set(filas.map((f) => f.sede))].sort(),
    estados: OPCIONES_VACIAS.estados,
  };

  return (
    <div className="flex flex-col gap-4">
      <InfraestructuraPersonalFiltros
        opciones={opciones}
        filtros={filtros}
        opcionesError={false}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {filas.length} planeación{filas.length !== 1 ? "es" : ""} encontrada{
            filas.length === 0 ? "." : ""
          }
        </div>
      </div>
      <InfraestructuraPersonalTabla
        filas={filas}
        puedeEditar={puedeEditarPlaneacion(alcance.usuario.rol)}
      />
    </div>
  );
}
