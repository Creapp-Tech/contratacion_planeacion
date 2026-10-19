import { notFound } from "next/navigation"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import {
  puedeGestionarRegional,
  requireAccesoPlaneacion,
} from "@/lib/auth/session"
import { etiquetaEstadoSede, varianteEstadoSede } from "@/lib/sedes/estados"
import { getSede, type SedeArea } from "@/lib/sedes/queries"

function Dato({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? value ?? "—"}</dd>
    </div>
  )
}

function numero(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("es-CO").format(value)
}

function Seccion({
  titulo,
  className,
  children,
}: {
  titulo: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {children}
    </div>
  )
}

const GRID_AREAS = "grid grid-cols-[1fr_5rem_5rem_5rem] items-center gap-2"

function agruparAreas(areas: SedeArea[]) {
  const mapa = new Map<string, SedeArea[]>()
  for (const area of areas) {
    const categoria = area.areas_catalogo?.categoria ?? "Sin categoría"
    const lista = mapa.get(categoria) ?? []
    lista.push(area)
    mapa.set(categoria, lista)
  }
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export async function SedeDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const usuario = await requireAccesoPlaneacion()

  const { id } = await params
  const sede = await getSede(id)

  if (!sede || !(await puedeGestionarRegional(usuario, sede.regional))) {
    notFound()
  }

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <Seccion titulo="Identificación">
        <dl className="flex flex-col">
          <Dato label="Nombre" value={sede.nombre} />
          <Dato label="Código REPS" value={sede.codigo_reps ?? "—"} />
          <Dato label="Marca" value={sede.marca ?? "—"} />
          <Dato label="Nivel" value={sede.nivel ?? "—"} />
          <Dato label="Tipo de IPS" value={sede.tipo_ips ?? "—"} />
        </dl>
      </Seccion>

      <Seccion titulo="Ubicación">
        <dl className="flex flex-col">
          <Dato label="País" value={sede.pais ?? "—"} />
          <Dato label="Departamento" value={sede.departamento ?? "—"} />
          <Dato label="Municipio" value={sede.municipio ?? "—"} />
          <Dato label="Barrio" value={sede.barrio ?? "—"} />
          <Dato label="Dirección" value={sede.direccion ?? "—"} />
          <Dato
            label="Coordenadas"
            value={
              sede.latitud != null && sede.longitud != null
                ? `${sede.latitud}, ${sede.longitud}`
                : "—"
            }
          />
        </dl>
      </Seccion>

      <Seccion titulo="Organización">
        <dl className="flex flex-col">
          <Dato label="Gerente" value={sede.gerente ?? "—"} />
          <Dato label="Fecha de apertura" value={sede.fecha_apertura ?? "—"} />
          <Dato label="Regional" value={sede.regional ?? "—"} />
          <Dato label="Zonal" value={sede.zonal ?? "—"} />
          <Dato label="Estado">
            <Badge variant={varianteEstadoSede(sede.estado)}>
              {etiquetaEstadoSede(sede.estado)}
            </Badge>
          </Dato>
          <Dato label="Fecha de cierre" value={sede.fecha_cierre ?? "—"} />
        </dl>
      </Seccion>

      <Seccion titulo="Área y capacidad">
        <dl className="flex flex-col">
          <Dato label="Metros cuadrados" value={numero(sede.metros_cuadrado)} />
          <Dato label="Número de pisos" value={numero(sede.numero_pisos)} />
          <Dato
            label="Capacidad inicial"
            value={numero(sede.capacidad_inicial)}
          />
          <Dato
            label="Capacidad actual"
            value={numero(sede.capacidad_usuarios)}
          />
        </dl>
      </Seccion>

      <Seccion titulo="Áreas de la sede" className="xl:col-span-2">
        {sede.areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay áreas asignadas.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {agruparAreas(sede.areas).map(([categoria, areas]) => {
              const existentes = areas.reduce(
                (total, area) => total + area.cantidad,
                0
              )
              const habilitadas = areas.reduce(
                (total, area) => total + area.cantidad_habilitada,
                0
              )
              const disponibles = existentes - habilitadas
              return (
                <div key={categoria} className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {categoria}
                  </h3>
                  <div className="divide-y rounded-lg border">
                    <div
                      className={cn(
                        GRID_AREAS,
                        "px-3 py-1.5 text-xs font-medium text-muted-foreground"
                      )}
                    >
                      <span>Área</span>
                      <span className="text-center">Existentes</span>
                      <span className="text-center">Habilitadas</span>
                      <span className="text-center">Disponibles</span>
                    </div>
                    {areas.map((area) => {
                      const disp =
                        area.cantidad - area.cantidad_habilitada
                      return (
                        <div
                          key={area.id}
                          className={cn(GRID_AREAS, "px-3 py-1.5 text-sm")}
                        >
                          <span>{area.areas_catalogo?.nombre ?? "Área"}</span>
                          <span className="text-center tabular-nums">
                            {numero(area.cantidad)}
                          </span>
                          <span className="text-center tabular-nums">
                            {numero(area.cantidad_habilitada)}
                          </span>
                          <span
                            className={cn(
                              "text-center tabular-nums",
                              disp === 0 && "text-muted-foreground"
                            )}
                          >
                            {numero(disp)}
                          </span>
                        </div>
                      )
                    })}
                    <div
                      className={cn(
                        GRID_AREAS,
                        "bg-muted/40 px-3 py-1.5 text-sm font-medium"
                      )}
                    >
                      <span>Total</span>
                      <span className="text-center tabular-nums">
                        {numero(existentes)}
                      </span>
                      <span className="text-center tabular-nums">
                        {numero(habilitadas)}
                      </span>
                      <span className="text-center tabular-nums">
                        {numero(disponibles)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Seccion>

      <Seccion titulo="Aseguradores">
        {sede.aseguradores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay aseguradores asignados.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sede.aseguradores.map((asegurador) => (
              <li key={asegurador.id} className="text-sm">
                {asegurador.aseguradores_eps?.nombre_eps ?? "Asegurador"}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {sede.observaciones ? (
        <Seccion titulo="Observaciones">
          <p className="text-sm whitespace-pre-line">{sede.observaciones}</p>
        </Seccion>
      ) : null}
    </div>
  )
}
