import {
  Activity,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  Calculator,
  ClipboardList,
  Database,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  FolderTree,
  Gauge,
  Globe,
  History,
  Layers,
  LayoutGrid,
  ListChecks,
  Map,
  MapPin,
  MapPinned,
  ShieldCheck,
  Stethoscope,
  Tag,
  TrendingUp,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  ROLES_CONTRATACION,
  ROLES_PLANEACION,
  type Rol,
} from "@/lib/constants/roles"

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
        roles: ROLES_PLANEACION,
      },
      {
        title: "Mapa de sedes",
        href: "/sedes/mapa",
        icon: Map,
        roles: ROLES_PLANEACION,
      },
      {
        title: "Análisis de capacidad instalada",
        href: "/capacidad-instalada",
        icon: BarChart3,
        roles: ROLES_PLANEACION,
      },
      {
        title: "Población",
        href: "/poblaciones",
        icon: Users,
        roles: ROLES_PLANEACION,
      },
      {
        title: "Planeaciones",
        href: "/planeaciones",
        icon: FileText,
        roles: ROLES_PLANEACION,
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
    label: "Contratación",
    items: [
      {
        title: "Contratos",
        href: "/contratos",
        icon: FileSignature,
        roles: ROLES_CONTRATACION,
      },
      {
        title: "Historial",
        href: "/historial",
        icon: History,
        roles: ROLES_CONTRATACION,
      },
      {
        title: "Seguimiento IPC",
        href: "/ipc",
        icon: TrendingUp,
        roles: ROLES_CONTRATACION,
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
        title: "Grupos de servicio",
        href: "/configuracion/grupos-servicio",
        icon: Boxes,
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
        title: "Categorías",
        href: "/configuracion/categorias",
        icon: FolderTree,
        roles: ["superadmin"],
      },
      {
        title: "Programas",
        href: "/configuracion/programas",
        icon: FolderKanban,
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
        title: "IPC Nacional",
        href: "/configuracion/ipc-nacional",
        icon: Globe,
        roles: ["superadmin"],
      },
      {
        title: "Tipos de personal",
        href: "/configuracion/tipos-personal",
        icon: Users,
        roles: ["superadmin"],
      },
      {
        title: "Responsables",
        href: "/configuracion/responsables",
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