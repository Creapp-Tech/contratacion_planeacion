import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  puedeGestionarRegional,
  requireAccesoPlaneacion,
} from "@/lib/auth/session"
import { etiquetaEstadoSede, varianteEstadoSede } from "@/lib/sedes/estados"
import { getSede } from "@/lib/sedes/queries"

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
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {children}
    </div>
  )
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
    <div className="flex flex-col gap-8">
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

      <Seccion titulo="Áreas de la sede">
        {sede.areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay áreas asignadas.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sede.areas.map((area) => {
              const disponibles = area.cantidad - area.cantidad_habilitada
              return (
                <li key={area.id} className="text-sm">
                  {area.areas_catalogo?.nombre ?? "Área"}{" "}
                  <span className="text-muted-foreground">
                    ({area.areas_catalogo?.categoria ?? "—"})
                  </span>{" "}
                  · {area.cantidad_habilitada} de {area.cantidad} habilitadas
                  {disponibles > 0 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      ({disponibles} disponible{disponibles === 1 ? "" : "s"})
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
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
