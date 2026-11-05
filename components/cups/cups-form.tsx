"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"

import { cupsSchema, type CupsInput } from "@/lib/validations/cups"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { obtenerGruposServicio, obtenerServiciosPorGrupo } from "@/app/(dashboard)/configuracion/cups/actions"

type GrupoOption = { id: string; nombre: string }
type ServicioOption = { id: string; nombre: string }

type CupsFormProps = {
  onSubmit: (data: CupsInput) => Promise<{ success: true } | { error: string }>
  initialData?: CupsInput
  submitting?: boolean
}

export function CupsForm({ onSubmit, initialData, submitting = false }: CupsFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<GrupoOption[]>([])
  const [servicios, setServicios] = useState<ServicioOption[]>([])
  const [gruposCargando, setGruposCargando] = useState(true)
  const [servicioSeleccionadoNombre, setServicioSeleccionadoNombre] = useState("")

  const form = useForm<CupsInput>({
    resolver: zodResolver(cupsSchema),
    defaultValues: {
      codigo: initialData?.codigo ?? "",
      descripcion: initialData?.descripcion ?? "",
      grupo_id: initialData?.grupo_id ?? "",
      servicio_id: initialData?.servicio_id ?? "",
      seccion: initialData?.seccion ?? "",
      version_resolucion: initialData?.version_resolucion ?? "",
      fecha_inicio: initialData?.fecha_inicio ? new Date(initialData.fecha_inicio) : new Date(),
      fecha_fin: initialData?.fecha_fin ? new Date(initialData.fecha_fin) : undefined,
      activo: initialData?.activo ?? true,
    },
  })

  useEffect(() => {
    cargarGrupos()
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
          Descripción del CUPS
        </label>
        <input
          {...form.register("descripcion")}
          className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ej. Consulta médica general"
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

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Sección
        </label>
        <input
          {...form.register("seccion")}
          className="w-full border border-input bg-input px-3 py-2 rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-disabled disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ej. Consultas externas"
        />
        {form.formState.errors.seccion && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.seccion.message}</p>
        )}
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
