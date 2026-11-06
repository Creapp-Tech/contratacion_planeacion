"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"

import { cupsSchema, type CupsInput } from "@/lib/validations/cups"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { obtenerGruposServicio, obtenerOpcionesCups, obtenerServiciosPorGrupo } from "@/app/(dashboard)/configuracion/cups/actions"

const SIN_VALOR = "__sin_valor__"

type GrupoOption = { id: string; nombre: string }
type ServicioOption = { id: string; nombre: string }

type CupsFormInitialData = Omit<Partial<CupsInput>, "fecha_fin"> & {
  fecha_fin?: string | null
}

type CupsFormProps = {
  onSubmit: (data: CupsInput) => Promise<{ success: true } | { error: string }>
  initialData?: CupsFormInitialData
  submitting?: boolean
}

function fechaLocalHoy() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, "0")
  const dia = String(hoy.getDate()).padStart(2, "0")
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function CupsForm({ onSubmit, initialData, submitting = false }: CupsFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<GrupoOption[]>([])
  const [servicios, setServicios] = useState<ServicioOption[]>([])
  const [capitulos, setCapitulos] = useState<string[]>([])
  const [secciones, setSecciones] = useState<string[]>([])
  const [gruposCargando, setGruposCargando] = useState(true)
  const [servicioSeleccionadoNombre, setServicioSeleccionadoNombre] = useState("")

  const form = useForm<CupsInput>({
    resolver: zodResolver(cupsSchema),
    defaultValues: {
      codigo: initialData?.codigo ?? "",
      nombre: initialData?.nombre ?? "",
      descripcion: initialData?.descripcion ?? "",
      capitulo: initialData?.capitulo ?? "",
      grupo_id: initialData?.grupo_id ?? "",
      servicio_id: initialData?.servicio_id ?? "",
      seccion: initialData?.seccion ?? "",
      extra_vii: initialData?.extra_vii ?? "",
      extra_viii: initialData?.extra_viii ?? "",
      extra_ix: initialData?.extra_ix ?? "",
      version_resolucion: initialData?.version_resolucion ?? "",
      fecha_inicio: initialData?.fecha_inicio ?? fechaLocalHoy(),
      fecha_fin: initialData?.fecha_fin ?? "",
      activo: initialData?.activo ?? true,
    },
  })

  useEffect(() => {
    cargarGrupos()
    cargarOpciones()
  }, [])

  // Resetear servicio_id si el servicio seleccionado ya no está en la lista
  // (por ejemplo, al cambiar de grupo de servicio)
  useEffect(() => {
    const servicioId = String(form.getValues("servicio_id") ?? "")
    if (servicioId && !servicios.some((s) => s.id === servicioId)) {
      form.setValue("servicio_id", "")
    }
  }, [servicios, form])

  async function cargarGrupos() {
    setGruposCargando(true)
    const result = await obtenerGruposServicio()
    if ("success" in result) {
      setGrupos(result.grupos)
      const grupoId = form.getValues("grupo_id") as string | null
      if (grupoId) {
        cargarServicios(grupoId)
      }
    }
    setGruposCargando(false)
  }

  async function cargarServicios(grupoId: string) {
    const result = await obtenerServiciosPorGrupo(grupoId)
    if ("success" in result) {
      setServicios(result.servicios)
    } else {
      setServicios([])
    }
  }

  async function cargarOpciones() {
    const result = await obtenerOpcionesCups()
    if ("success" in result) {
      setCapitulos(result.capitulos)
      setSecciones(result.secciones)
    }
  }

  async function onSubmitForm(values: CupsInput) {
    setError(null)
    const result = await onSubmit(values)
    if ("error" in result) {
      setError(result.error)
    }
  }

  function manejarCambioGrupo(value: string) {
    const grupoId = value === "" ? null : value
    form.setValue("grupo_id", grupoId === null ? "" : grupoId)
    form.setValue("servicio_id", "")
    setServicioSeleccionadoNombre("")
    setServicios([])
    if (grupoId) {
      cargarServicios(grupoId)
    }
  }

  const capituloItems: Record<string, string> = {
    [SIN_VALOR]: "Sin capítulo",
    ...Object.fromEntries(capitulos.map((valor) => [valor, valor])),
  }

  const seccionItems: Record<string, string> = {
    [SIN_VALOR]: "Sin sección",
    ...Object.fromEntries(secciones.map((valor) => [valor, valor])),
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmitForm)}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Código (6 dígitos)
        </label>
        <input
          {...form.register("codigo")}
          maxLength={6}
          className="uppercase w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ej. 000001"
        />
        {form.formState.errors.codigo && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.codigo.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Nombre
        </label>
        <input
          {...form.register("nombre")}
          className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ej. Consulta médica general"
        />
        {form.formState.errors.nombre && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Descripción (opcional)
        </label>
        <input
          {...form.register("descripcion")}
          className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Descripción ampliada del CUPS"
        />
        {form.formState.errors.descripcion && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.descripcion.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Grupo de servicio
        </label>
        <Select
          value={form.getValues("grupo_id")}
          onValueChange={(value) => {
            manejarCambioGrupo(value === null ? "" : String(value))
          }}
          disabled={gruposCargando}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar grupo">
              {form.getValues("grupo_id")
                ? grupos.find((g) => g.id === form.getValues("grupo_id"))?.nombre
                : ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {grupos.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.grupo_id && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.grupo_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Servicio
        </label>
        <Select
          value={form.getValues("servicio_id")}
          onValueChange={(value) => {
            const svcId = value === null ? "" : String(value)
            const svc = servicios.find((s) => s.id === svcId)
            form.setValue("servicio_id", svcId)
            setServicioSeleccionadoNombre(svc ? svc.nombre : "")
          }}
          disabled={!form.getValues("grupo_id") || servicios.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar servicio">
              {servicioSeleccionadoNombre}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {servicios.map((s: ServicioOption) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
            {servicios.length === 0 && Boolean(form.getValues("grupo_id")) && (
              <SelectItem disabled>
                {gruposCargando ? "Cargando servicios..." : "No hay servicios para este grupo"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.servicio_id && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.servicio_id.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Capítulo (opcional)
          </label>
          <Controller
            control={form.control}
            name="capitulo"
            render={({ field }) => {
              const valor = field.value ?? ""
              const items: Record<string, string> = { ...capituloItems }
              if (valor && !items[valor]) items[valor] = valor

              return (
                <Select
                  value={valor || SIN_VALOR}
                  onValueChange={(value) =>
                    field.onChange(
                      value === SIN_VALOR || value == null ? "" : String(value)
                    )
                  }
                  items={items}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar capítulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_VALOR}>Sin capítulo</SelectItem>
                    {Object.entries(items)
                      .filter(([value]) => value !== SIN_VALOR)
                      .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
          {form.formState.errors.capitulo && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.capitulo.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Sección (opcional)
          </label>
          <Controller
            control={form.control}
            name="seccion"
            render={({ field }) => {
              const valor = field.value ?? ""
              const items: Record<string, string> = { ...seccionItems }
              if (valor && !items[valor]) items[valor] = valor

              return (
                <Select
                  value={valor || SIN_VALOR}
                  onValueChange={(value) =>
                    field.onChange(
                      value === SIN_VALOR || value == null ? "" : String(value)
                    )
                  }
                  items={items}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_VALOR}>Sin sección</SelectItem>
                    {Object.entries(items)
                      .filter(([value]) => value !== SIN_VALOR)
                      .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
          {form.formState.errors.seccion && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.seccion.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Extra VII (opcional)
          </label>
          <input
            {...form.register("extra_vii")}
            className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.extra_vii && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.extra_vii.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Extra VIII (opcional)
          </label>
          <input
            {...form.register("extra_viii")}
            className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.extra_viii && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.extra_viii.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Extra IX (opcional)
          </label>
          <input
            {...form.register("extra_ix")}
            className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.extra_ix && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.extra_ix.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Versión de la resolución
        </label>
        <input
          {...form.register("version_resolucion")}
          className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ej. v1 / Resolución 2808 de 2022"
        />
        {form.formState.errors.version_resolucion && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.version_resolucion.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Fecha inicio vigencia
          </label>
          <input
            type="date"
            {...form.register("fecha_inicio")}
            className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.fecha_inicio && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.fecha_inicio.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Fecha fin vigencia (opcional)
          </label>
          <input
            type="date"
            {...form.register("fecha_fin")}
            className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.formState.errors.fecha_fin && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.fecha_fin.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...form.register("activo")}
          className="rounded bg-transparent border-input hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary"
        />
        <label className="text-sm text-muted-foreground">CUPS activo</label>
        {form.formState.errors.activo && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.activo.message}</p>
        )}
      </div>

      {error ? (
        <div className="p-2 rounded bg-red-50 text-red-800 text-xs border border-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          Guardar
        </Button>
        <Button type="button" variant="outline">
          Cancelar
        </Button>
      </div>
    </form>
  )
}
