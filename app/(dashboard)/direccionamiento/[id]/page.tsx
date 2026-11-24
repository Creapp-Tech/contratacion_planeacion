import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeftIcon, Pencil } from "lucide-react"
import { cn } from "cn"

import { SoloEscritura } from "@/components/auth/permisos-provider"
import {
  PanelContratos,
  PanelHistorial,
  PanelNovedades,
  PanelResumen,
  PanelSedes,
  PanelServicios,
} from "@/components/direccionamiento/paneles-direccionamiento"
import {
  DireccionamientoTabs,
  type TabDireccionamiento,
} from "@/components/direccionamiento/direccionamiento-tabs"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  alcanceDelUsuario,
  requireAccesoDireccionamiento,
} from "@/lib/auth/session"
import { puedeVerRegistroDireccionamiento } from "@/lib/direccionamiento/permisos"
import {
  etiquetaDireccionamiento,
  varianteEstadoDireccionamiento,
} from "@/lib/direccionamiento/constantes"
import {
  getDetalleDireccionamiento,
  listOpcionesDireccionamiento,
} from "@/lib/direccionamiento/queries"
import { puedeEditarDireccionamiento } from "@/lib/constants/roles"

export const metadata: Metadata = {
  title: "Ficha del especialista",
}

const TABS: TabDireccionamiento[] = [
  "resumen",
  "contratos",
  "servicios",
  "sedes",
  "novedades",
  "historial",
]

type DetallePageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function tabValida(valor: string | string[] | undefined): TabDireccionamiento {
  if (typeof valor !== "string") return "resumen"
  return TABS.includes(valor as TabDireccionamiento)
    ? (valor as TabDireccionamiento)
    : "resumen"
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

/**
 * Toda la lectura de sesión (io()) y de datos va dentro de este componente.
 * La página mantiene un shell estático y el contenido se transmite dentro de
 * <Suspense>, evitando que la navegación bloquee con Cache Components.
 */
async function DetalleContenido({ params, searchParams }: DetallePageProps) {
  const [{ id }, query, usuario] = await Promise.all([
    params,
    searchParams,
    requireAccesoDireccionamiento(),
  ])

  const [detalle, opciones, alcance] = await Promise.all([
    getDetalleDireccionamiento(id),
    listOpcionesDireccionamiento(),
    alcanceDelUsuario(usuario),
  ])

  if (!detalle) notFound()
  const gestionaRegional = puedeVerRegistroDireccionamiento(
    usuario.rol,
    alcance.regional,
    detalle.regionales,
    detalle.especialista.created_by,
    usuario.id
  )
  if (!gestionaRegional) {
    redirect("/direccionamiento")
  }

  const tab = tabValida(query.tab)
  const puedeEditar =
    puedeEditarDireccionamiento(usuario.rol) && gestionaRegional
  const props = { detalle, opciones, puedeEditar }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">
              {detalle.especialista.nombre_completo}
            </h1>
            <Badge
              variant={varianteEstadoDireccionamiento(
                detalle.especialista.estado
              )}
            >
              {etiquetaDireccionamiento(detalle.especialista.estado)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {etiquetaDireccionamiento(detalle.especialista.tipo_identificacion)}{" "}
            {detalle.especialista.numero_identificacion} ·{" "}
            {detalle.especialista.especialidad} ·{" "}
            {detalle.regionales.length > 0
              ? detalle.regionales.join(", ")
              : "Sin sedes asignadas"}{" "}
            · {detalle.especialista.ciudad}
          </p>
        </div>
        {puedeEditar ? (
          <SoloEscritura>
            <Link
              href={`/direccionamiento/${id}/editar`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Pencil />
              Editar especialista
            </Link>
          </SoloEscritura>
        ) : null}
      </div>

      <DireccionamientoTabs
        activa={tab}
        contratos={detalle.contratos.length}
        servicios={detalle.servicios.length}
        sedes={detalle.asignaciones.length}
        novedades={detalle.novedades.length}
      />

      {tab === "resumen" ? <PanelResumen {...props} /> : null}
      {tab === "contratos" ? <PanelContratos {...props} /> : null}
      {tab === "servicios" ? <PanelServicios {...props} /> : null}
      {tab === "sedes" ? <PanelSedes {...props} /> : null}
      {tab === "novedades" ? <PanelNovedades {...props} /> : null}
      {tab === "historial" ? <PanelHistorial {...props} /> : null}
    </>
  )
}

export default function DireccionamientoDetallePage(props: DetallePageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Link
        href="/direccionamiento"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeftIcon />
        Volver a direccionamiento
      </Link>

      <Suspense fallback={<DetalleSkeleton />}>
        <DetalleContenido {...props} />
      </Suspense>
    </div>
  )
}
