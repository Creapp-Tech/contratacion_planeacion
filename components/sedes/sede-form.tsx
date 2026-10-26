"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import {
  actualizarSede,
  crearSede,
} from "@/app/(dashboard)/sedes/actions"
import { ChoiceChips } from "@/components/shared/choice-chips"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  SEDE_ESTADOS,
  SEDE_ESTADO_VALUES,
  type SedeEstado,
} from "@/lib/sedes/estados"
import type {
  AreaCatalogo,
  Asegurador,
  OpcionesCatalogo,
  SedeDetalle,
} from "@/lib/sedes/queries"

const SIN_VALOR = "__sin_valor__"

const formSchema = z.object({
  nombre: z.string().min(1, "Nombre obligatorio"),
  marca: z.string().min(1, "Marca obligatoria"),
  tipo_ips: z.string(),
  nivel: z.string(),
  codigo_reps: z.string(),
  departamento: z.string().min(1, "Departamento obligatorio"),
  municipio: z.string().min(1, "Municipio obligatorio"),
  barrio: z.string(),
  direccion: z.string(),
  pais: z.string().min(1, "País obligatorio"),
  latitud: z.string(),
  longitud: z.string(),
  gerente: z.string(),
  fecha_apertura: z.string(),
  regional: z.string().min(1, "Regional obligatorio"),
  zonal: z.string().min(1, "Zonal obligatorio"),
  estado: z.enum(SEDE_ESTADO_VALUES, "Estado obligatorio"),
  fecha_cierre: z.string(),
  metros_cuadrado: z.string(),
  capacidad_inicial: z.string(),
  capacidad_usuarios: z.string(),
  numero_pisos: z.string(),
  observaciones: z.string(),
})

type FormValues = z.infer<typeof formSchema>

type AreaSeleccion = {
  cantidad: number
  cantidad_habilitada: number
}

function toSelectItems(options: string[]) {
  return Object.fromEntries([
    [SIN_VALOR, "Sin definir"],
    ...options.map((option) => [option, option]),
  ])
}

type SedeFormProps = {
  mode: "crear" | "editar"
  sede?: SedeDetalle
  opciones: OpcionesCatalogo
  areasCatalogo: AreaCatalogo[]
  aseguradores: Asegurador[]
}

function SeccionCard({
  titulo,
  descripcion,
  className,
  children,
}: {
  titulo: string
  descripcion?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="font-heading">{titulo}</CardTitle>
        {descripcion ? <CardDescription>{descripcion}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

export function SedeForm({
  mode,
  sede,
  opciones,
  areasCatalogo,
  aseguradores,
}: SedeFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const [areasSeleccionadas, setAreasSeleccionadas] = useState<
    Record<string, AreaSeleccion>
  >(() => {
    if (!sede) return {}
    return Object.fromEntries(
      sede.areas.map((area) => [
        area.area_id,
        {
          cantidad: area.cantidad,
          cantidad_habilitada: area.cantidad_habilitada ?? area.cantidad,
        },
      ])
    )
  })

  const [aseguradoresSeleccionados, setAseguradoresSeleccionados] = useState<
    Set<string>
  >(() => new Set(sede?.aseguradores.map((a) => a.asegurador_eps_id) ?? []))

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: sede?.nombre ?? "",
      marca: sede?.marca ?? "",
      tipo_ips: sede?.tipo_ips ?? "",
      nivel: sede?.nivel ?? "",
      codigo_reps: sede?.codigo_reps ?? "",
      departamento: sede?.departamento ?? "",
      municipio: sede?.municipio ?? "",
      barrio: sede?.barrio ?? "",
      direccion: sede?.direccion ?? "",
      pais: sede?.pais ?? "Colombia",
      latitud: sede?.latitud != null ? String(sede.latitud) : "",
      longitud: sede?.longitud != null ? String(sede.longitud) : "",
      gerente: sede?.gerente ?? "",
      fecha_apertura: sede?.fecha_apertura ?? "",
      regional: sede?.regional ?? "",
      zonal: sede?.zonal ?? "",
      estado: (sede?.estado as SedeEstado) ?? "activa",
      fecha_cierre: sede?.fecha_cierre ?? "",
      metros_cuadrado:
        sede?.metros_cuadrado != null ? String(sede.metros_cuadrado) : "",
      capacidad_inicial:
        sede?.capacidad_inicial != null ? String(sede.capacidad_inicial) : "",
      capacidad_usuarios:
        sede?.capacidad_usuarios != null ? String(sede.capacidad_usuarios) : "",
      numero_pisos: sede?.numero_pisos != null ? String(sede.numero_pisos) : "",
      observaciones: sede?.observaciones ?? "",
    },
  })

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const estado = useWatch({ control, name: "estado" })
  const tipoIps = useWatch({ control, name: "tipo_ips" })

  const descripcionTipoIps = useMemo(
    () =>
      opciones.tipo_ips.find((tipo) => tipo.nombre === tipoIps)?.descripcion ??
      null,
    [opciones.tipo_ips, tipoIps]
  )

  const areasPorCategoria = useMemo(() => {
    const mapa = new Map<string, AreaCatalogo[]>()
    for (const area of areasCatalogo) {
      const lista = mapa.get(area.categoria) ?? []
      lista.push(area)
      mapa.set(area.categoria, lista)
    }
    return [...mapa.entries()]
  }, [areasCatalogo])

  function toggleArea(area: AreaCatalogo) {
    setAreasSeleccionadas((prev) => {
      const siguiente = { ...prev }
      if (area.id in siguiente) {
        delete siguiente[area.id]
      } else {
        siguiente[area.id] = { cantidad: 1, cantidad_habilitada: 1 }
      }
      return siguiente
    })
  }

  function setCantidad(areaId: string, valor: number) {
    setAreasSeleccionadas((prev) => {
      const actual = prev[areaId]
      if (!actual) return prev
      const cantidad = Math.max(1, valor || 1)
      return {
        ...prev,
        [areaId]: {
          cantidad,
          cantidad_habilitada: Math.min(actual.cantidad_habilitada, cantidad),
        },
      }
    })
  }

  function setCantidadHabilitada(areaId: string, valor: number) {
    setAreasSeleccionadas((prev) => {
      const actual = prev[areaId]
      if (!actual) return prev
      const habilitada = Number.isNaN(valor) ? 0 : valor
      return {
        ...prev,
        [areaId]: {
          ...actual,
          cantidad_habilitada: Math.min(Math.max(0, habilitada), actual.cantidad),
        },
      }
    })
  }

  function toggleAsegurador(id: string) {
    setAseguradoresSeleccionados((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) {
        siguiente.delete(id)
      } else {
        siguiente.add(id)
      }
      return siguiente
    })
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const payload = {
      ...values,
      areas: Object.entries(areasSeleccionadas).map(
        ([area_id, { cantidad, cantidad_habilitada }]) => ({
          area_id,
          cantidad,
          cantidad_habilitada,
        })
      ),
      aseguradores: [...aseguradoresSeleccionados],
    }

    const result =
      mode === "editar" && sede
        ? await actualizarSede(sede.id, payload)
        : await crearSede(payload)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/sedes")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SeccionCard
          titulo="Identificación"
          descripcion="Datos generales y de clasificación de la sede."
          className="xl:col-span-2"
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.nombre}>
              <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
              <Input
                id="nombre"
                autoComplete="off"
                aria-invalid={!!errors.nombre}
                {...register("nombre")}
              />
              <FieldError errors={[errors.nombre]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="codigo_reps">Código REPS</FieldLabel>
                <Input
                  id="codigo_reps"
                  autoComplete="off"
                  {...register("codigo_reps")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="nivel">Nivel</FieldLabel>
                <Controller
                  control={control}
                  name="nivel"
                  render={({ field }) => (
                    <Select
                      value={field.value || SIN_VALOR}
                      onValueChange={(value) =>
                        field.onChange(value === SIN_VALOR ? "" : value)
                      }
                      items={toSelectItems(opciones.nivel)}
                    >
                      <SelectTrigger id="nivel" className="w-full">
                        <SelectValue placeholder="Selecciona el nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_VALOR}>Sin definir</SelectItem>
                        {opciones.nivel.map((nivel) => (
                          <SelectItem key={nivel} value={nivel}>
                            {nivel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.marca}>
                <FieldLabel>Marca</FieldLabel>
                <Controller
                  control={control}
                  name="marca"
                  render={({ field }) => (
                    <ChoiceChips
                      options={opciones.marca.map((marca) => ({
                        value: marca,
                        label: marca,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldError errors={[errors.marca]} />
              </Field>

              <Field data-invalid={!!errors.tipo_ips}>
                <FieldLabel>Tipo de IPS</FieldLabel>
                <Controller
                  control={control}
                  name="tipo_ips"
                  render={({ field }) => (
                    <ChoiceChips
                      options={opciones.tipo_ips.map((tipo) => ({
                        value: tipo.nombre,
                        label: tipo.nombre,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {descripcionTipoIps ? (
                  <FieldDescription>{descripcionTipoIps}</FieldDescription>
                ) : null}
                <FieldError errors={[errors.tipo_ips]} />
              </Field>
            </div>
          </FieldGroup>
        </SeccionCard>

        <SeccionCard
          titulo="Ubicación"
          descripcion="Dirección y coordenadas de la sede."
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="pais">País</FieldLabel>
                <Input id="pais" autoComplete="off" {...register("pais")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="departamento">Departamento</FieldLabel>
                <Input
                  id="departamento"
                  autoComplete="off"
                  {...register("departamento")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="municipio">Municipio</FieldLabel>
                <Input
                  id="municipio"
                  autoComplete="off"
                  {...register("municipio")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="barrio">Barrio</FieldLabel>
                <Input id="barrio" autoComplete="off" {...register("barrio")} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
              <Input
                id="direccion"
                autoComplete="off"
                {...register("direccion")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="latitud">Latitud</FieldLabel>
                <Input
                  id="latitud"
                  type="number"
                  step="any"
                  {...register("latitud")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="longitud">Longitud</FieldLabel>
                <Input
                  id="longitud"
                  type="number"
                  step="any"
                  {...register("longitud")}
                />
              </Field>
            </div>
          </FieldGroup>
        </SeccionCard>

        <SeccionCard
          titulo="Organización"
          descripcion="Responsable, fechas y adscripción."
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="gerente">Gerente</FieldLabel>
                <Input
                  id="gerente"
                  autoComplete="off"
                  {...register("gerente")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="fecha_apertura">Fecha de apertura</FieldLabel>
                <Input
                  id="fecha_apertura"
                  type="date"
                  {...register("fecha_apertura")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="regional">Regional</FieldLabel>
                <Controller
                  control={control}
                  name="regional"
                  render={({ field }) => (
                    <Select
                      value={field.value || SIN_VALOR}
                      onValueChange={(value) =>
                        field.onChange(value === SIN_VALOR ? "" : value)
                      }
                      items={toSelectItems(opciones.regional)}
                    >
                      <SelectTrigger id="regional" className="w-full">
                        <SelectValue placeholder="Selecciona la regional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_VALOR}>Sin definir</SelectItem>
                        {opciones.regional.map((regional) => (
                          <SelectItem key={regional} value={regional}>
                            {regional}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="zonal">Zonal</FieldLabel>
                <Controller
                  control={control}
                  name="zonal"
                  render={({ field }) => (
                    <Select
                      value={field.value || SIN_VALOR}
                      onValueChange={(value) =>
                        field.onChange(value === SIN_VALOR ? "" : value)
                      }
                      items={toSelectItems(opciones.zonal)}
                    >
                      <SelectTrigger id="zonal" className="w-full">
                        <SelectValue placeholder="Selecciona la zonal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_VALOR}>Sin definir</SelectItem>
                        {opciones.zonal.map((zonal) => (
                          <SelectItem key={zonal} value={zonal}>
                            {zonal}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Estado</FieldLabel>
                <Controller
                  control={control}
                  name="estado"
                  render={({ field }) => (
                    <ChoiceChips
                      options={SEDE_ESTADOS.map((estado) => ({
                        value: estado.value,
                        label: estado.label,
                      }))}
                      value={field.value}
                      onChange={(value) => field.onChange(value as SedeEstado)}
                    />
                  )}
                />
              </Field>

              {estado === "inactiva" ? (
                <Field>
                  <FieldLabel htmlFor="fecha_cierre">Fecha de cierre</FieldLabel>
                  <Input
                    id="fecha_cierre"
                    type="date"
                    {...register("fecha_cierre")}
                  />
                </Field>
              ) : null}
            </div>
          </FieldGroup>
        </SeccionCard>

        <SeccionCard
          titulo="Infraestructura y áreas"
          descripcion="Capacidad y unidades existentes y habilitadas por área."
          className="xl:col-span-2"
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="metros_cuadrado">
                  Metros cuadrados
                </FieldLabel>
                <Input
                  id="metros_cuadrado"
                  type="number"
                  step="any"
                  {...register("metros_cuadrado")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="numero_pisos">Número de pisos</FieldLabel>
                <Input
                  id="numero_pisos"
                  type="number"
                  {...register("numero_pisos")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="capacidad_inicial">
                  Capacidad inicial
                </FieldLabel>
                <Input
                  id="capacidad_inicial"
                  type="number"
                  {...register("capacidad_inicial")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="capacidad_usuarios">
                  Capacidad actual
                </FieldLabel>
                <Input
                  id="capacidad_usuarios"
                  type="number"
                  {...register("capacidad_usuarios")}
                />
              </Field>
            </div>
          </FieldGroup>

          <div className="grid gap-4 lg:grid-cols-2">
            {areasPorCategoria.map(([categoria, areas]) => (
              <div key={categoria} className="flex flex-col gap-1.5">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {categoria}
                </h3>
                <div className="divide-y rounded-lg border">
                  <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <span>Área</span>
                    <span className="text-center">Existentes</span>
                    <span className="text-center">Habilitadas</span>
                  </div>
                  {areas.map((area) => {
                    const seleccion = areasSeleccionadas[area.id]
                    return (
                      <div
                        key={area.id}
                        className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 px-3 py-1.5"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!seleccion}
                            onChange={() => toggleArea(area)}
                          />
                          {area.nombre}
                        </label>
                        {seleccion ? (
                          <Input
                            type="number"
                            min={1}
                            className="h-8 px-2 text-center"
                            value={seleccion.cantidad}
                            onChange={(event) =>
                              setCantidad(area.id, Number(event.target.value))
                            }
                            aria-label={`Unidades existentes de ${area.nombre}`}
                          />
                        ) : (
                          <span className="text-center text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                        {seleccion ? (
                          <Input
                            type="number"
                            min={0}
                            max={seleccion.cantidad}
                            className="h-8 px-2 text-center"
                            value={seleccion.cantidad_habilitada}
                            onChange={(event) =>
                              setCantidadHabilitada(
                                area.id,
                                Number(event.target.value)
                              )
                            }
                            aria-label={`Unidades habilitadas de ${area.nombre}`}
                          />
                        ) : (
                          <span className="text-center text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </SeccionCard>

        <SeccionCard
          titulo="Aseguradores"
          descripcion="EPS con las que opera la sede."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {aseguradores.map((asegurador) => (
              <label
                key={asegurador.id}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={aseguradoresSeleccionados.has(asegurador.id)}
                  onChange={() => toggleAsegurador(asegurador.id)}
                />
                {asegurador.nombre_eps}
              </label>
            ))}
          </div>
        </SeccionCard>

        <SeccionCard
          titulo="Observaciones"
          descripcion="Notas adicionales sobre la sede."
        >
          <Field>
            <Textarea id="observaciones" rows={4} {...register("observaciones")} />
          </Field>
        </SeccionCard>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear sede" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
