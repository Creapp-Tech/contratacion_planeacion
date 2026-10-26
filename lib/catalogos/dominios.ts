import {
  FolderKanban,
  FolderTree,
  Layers,
  MapPinned,
  Stethoscope,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react"

export type CatalogoDominio =
  | "marca"
  | "nivel"
  | "tipo_ips"
  | "zonal"
  | "tipo_personal"
  | "categoria"
  | "programa"

export interface CatalogoConfig {
  dominio: CatalogoDominio
  titulo: string
  singular: string
  ruta: string
  icono: LucideIcon
  usaDescripcion: boolean
}

export const CATALOGOS: Record<CatalogoDominio, CatalogoConfig> = {
  marca: {
    dominio: "marca",
    titulo: "Marcas",
    singular: "marca",
    ruta: "/configuracion/marcas",
    icono: Tag,
    usaDescripcion: false,
  },
  nivel: {
    dominio: "nivel",
    titulo: "Niveles",
    singular: "nivel",
    ruta: "/configuracion/niveles",
    icono: Layers,
    usaDescripcion: false,
  },
  tipo_ips: {
    dominio: "tipo_ips",
    titulo: "Tipos de IPS",
    singular: "tipo de IPS",
    ruta: "/configuracion/tipos-ips",
    icono: Stethoscope,
    usaDescripcion: true,
  },
  zonal: {
    dominio: "zonal",
    titulo: "Zonales",
    singular: "zonal",
    ruta: "/configuracion/zonales",
    icono: MapPinned,
    usaDescripcion: false,
  },
  tipo_personal: {
    dominio: "tipo_personal",
    titulo: "Tipos de personal",
    singular: "tipo de personal",
    ruta: "/configuracion/tipos-personal",
    icono: Users,
    usaDescripcion: false,
  },
  categoria: {
    dominio: "categoria",
    titulo: "Categorías",
    singular: "categoría",
    ruta: "/configuracion/categorias",
    icono: FolderTree,
    usaDescripcion: false,
  },
  programa: {
    dominio: "programa",
    titulo: "Programas",
    singular: "programa",
    ruta: "/configuracion/programas",
    icono: FolderKanban,
    usaDescripcion: false,
  },
}

export const CATALOGO_DOMINIOS = Object.keys(CATALOGOS) as CatalogoDominio[]

export function isCatalogoDominio(value: string): value is CatalogoDominio {
  return value in CATALOGOS
}
