export type TipoSede = "nueva" | "antigua";

export type EspacioId =
  | "sala_procedimiento"
  | "farmacia"
  | "sala_espera_pac"
  | "trabajo_social"
  | "sala_era";

export type EspacioRequerido = Record<EspacioId, boolean>;

export interface CatalogoOpcion {
  id: string;
  nombre: string;
}

export interface FrecuenciaReferenciaOpcion extends CatalogoOpcion {
  sede_nombre: string;
  regional: string | null;
  zonal: string | null;
  regimen_nombre: string;
  asegurador_nombre: string;
  version: string;
}

export interface PlaneacionServicio {
  servicio_id: string;
  nombre: string;
  grupo_id: string | null;
  grupo_nombre: string | null;
  tipo_personal: string;
  duracion_minutos: number | null;
  seleccionado: boolean;
  frecuencia: number | null;
}

export interface PlaneacionBorrador {
  id: string;
  tipo_sede: TipoSede;
  // Sección A
  asegurador_id: string | null;
  asegurador_nombre: string | null;
  regimen_id: string | null;
  regimen_nombre: string | null;
  regional_id: string | null;
  regional_nombre: string | null;
  zonal_id: string | null;
  zonal_nombre: string | null;
  sede_id: string | null; // solo si Sede antigua
  sede_nombre: string | null; // solo si Sede nueva (texto libre)
  // Sección B
  espacios: EspacioRequerido;
  // Sección C
  usar_frecuencias_referencia: boolean;
  frecuencia_referencia_id: string | null;
  frecuencia_referencia_nombre: string | null;
  // Sección D
  servicios: PlaneacionServicio[];
}

export interface PlaneacionListaFila {
  id: string;
  sede: string;
  tipo_sede: "Nueva" | "Antigua";
  asegurador: string;
  regimen: string;
  regional: string;
  zonal: string;
  servicios: number;
  apoyos: number;
  estado: "Borrador" | "En revisión" | "Aprobada";
  created_at: string;
}

export interface ServicioAgrupadoOpcion {
  id: string;
  nombre: string;
  orden: number;
  servicios: {
    id: string;
    nombre: string;
    grupo_id: string | null;
    duracion_minutos: number | null;
    tipo_personal: string;
    orden: number;
  }[];
}

export interface InfraestructuraPersonalOpciones {
  aseguradores: { id: string; nombre: string }[];
  regímenes: { id: string; nombre: string }[];
  regionales: string[];
  zonales: string[];
  sedes: {
    id: string;
    nombre: string;
    regional: string | null;
    zonal: string | null;
  }[];
  serviciosAgrupados: ServicioAgrupadoOpcion[];
  frecuenciasNotaTecnica: {
    id: string;
    nombre: string;
    sede_nombre: string;
    regional: string | null;
    zonal: string | null;
    regimen_nombre: string;
    asegurador_nombre: string;
    version: string;
  }[];
}
