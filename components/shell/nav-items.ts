import {
  Activity,
  BarChart3,
  BellRing,
  Building2,
  Calculator,
  ClipboardList,
  Database,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers,
  LayoutGrid,
  ListChecks,
  Map,
  MapPin,
  MapPinned,
  ShieldCheck,
  Stethoscope,
  Tag,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { Rol } from "@/lib/constants/roles"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles: Rol[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

// Solo módulos del admin panel actual
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Planeación",
    items: [
      {
        title: "Sedes",
        href: "/sedes",
        icon: MapPin,
        roles: ["superadmin"],
      },
      {
        title: "Mapa de sedes",
        href: "/sedes/mapa",
        icon: Map,
        roles: ["superadmin"],
      },
      {
        title: "Análisis de capacidad instalada",
        href: "/capacidad-instalada",
        icon: BarChart3,
        roles: ["superadmin"],
      },
      {
        title: "Población",
        href: "/poblaciones",
        icon: Users,
        roles: ["superadmin"],
      },
      {
        title: "Frecuencias de uso",
        href: "/frecuencias",
        icon: Gauge,
        roles: ["superadmin"],
      },
    ],
  },
  {
    label: "Configuración",
    collapsible: true,
    items: [
      {
        title: "Servicios",
        href: "/servicios",
        icon: ClipboardList,
        roles: ["superadmin"],
      },
      {
        title: "Regionales",
        href: "/configuracion/regionales",
        icon: Building2,
        roles: ["superadmin"],
      },
      {
        title: "Marcas",
        href: "/configuracion/marcas",
        icon: Tag,
        roles: ["superadmin"],
      },
      {
        title: "Niveles",
        href: "/configuracion/niveles",
        icon: Layers,
        roles: ["superadmin"],
      },
      {
        title: "Áreas",
        href: "/configuracion/areas",
        icon: LayoutGrid,
        roles: ["superadmin"],
      },
      {
        title: "Tipos de IPS",
        href: "/configuracion/tipos-ips",
        icon: Stethoscope,
        roles: ["superadmin"],
      },
      {
        title: "Zonales",
        href: "/configuracion/zonales",
        icon: MapPinned,
        roles: ["superadmin"],
      },
      {
        title: "Aseguradores",
        href: "/configuracion/aseguradores",
        icon: ShieldCheck,
        roles: ["superadmin"],
      },
      {
        title: "Tipos de personal",
        href: "/configuracion/tipos-personal",
        icon: Users,
        roles: ["superadmin"],
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Usuarios",
        href: "/usuarios",
        icon: UserCog,
        roles: ["superadmin"],
      },
    ],
  },
]

export function getNavGroups(rol: string | null): NavGroup[] {
  if (!rol) return []
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(rol as Rol)),
  })).filter((group) => group.items.length > 0)
}