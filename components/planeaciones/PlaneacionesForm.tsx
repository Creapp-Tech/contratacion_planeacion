"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { planeacionSchema } from "@/lib/planeaciones/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronDownIcon } from "lucide-react"
import { useMemo } from "react"
import { crearPlaneacion } from "@/app/(dashboard)/planeaciones/actions"

type OpcionSelect = { id: string; nombre: string }

type OpcionFrecuencia = { id: string; nombre: string; etiqueta?: string }

type OpcionesPlaneacion = {
  regionales: OpcionSelect[]
  regimenes: OpcionSelect[]
  aseguradores: OpcionSelect[]
}

const GRUPOS_SERVICIO = [
  "Medicina General",
  "Consulta especializada",
  "Odontologia",
  "Odontologia especializada",
  "Enfermeria y promocion",
  "Terapias",
  "Apoyo paramedico",
  "Citologia",
  "Patologia",
  "Laboratorio",
  "Imagenologia",
  "Otros procedimientos diagnostico y terapias",
  "Cirugia",
  "Medicamentos",
  "PRG",
] as const

type GrupoServicio = (typeof GRUPOS_SERVICIO)[number]

interface ServicioTabla {
  id: string
  nombre: string
  grupo: GrupoServicio
  frecuencia_actual: string
  checked: boolean
}

export function PlaneacionesForm({
  planeaciones = [],
  opciones = { regionales: [], regimenes: [], aseguradores: [] },
  frecuenciasReferencia = [],
}: {
  planeaciones?: any[]
  opciones?: OpcionesPlaneacion
  frecuenciasReferencia?: OpcionFrecuencia[]
} = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<any>({
    resolver: zodResolver(planeacionSchema) as any,
    defaultValues: {
      regional: null,
      poblacion: null,
      nombre: "",
      version: null,
      regimen: null,
      asegurador: null,
      tiene_nota_tecnica: false,
      frecuencias_referencia: [],
      servicios_seleccionados: [],
    },
  })

  const {
    setValue: formSetValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = form

  const formValues = watch()

  // Servicios de ejemplo por grupo (en un caso real vendrían de la API)
  const serviciosPorGrupo = useMemo(() => {
    const mapa = new Map<GrupoServicio, ServicioTabla[]>()
    
    // Servicios de ejemplo para cada grupo
    const serviciosEjemplo: { nombre: string; frecuencia: string }[] = [
      // Medicina General
      { nombre: "Consulta general", frecuencia: "Diaria" },
      { nombre: "Revision medica", frecuencia: "Semanal" },
      // Consulta especializada
      { nombre: "Cardiologia", frecuencia: "Quincenal" },
      { nombre: "Neumologia", frecuencia: "Mensual" },
      // Odontologia
      { nombre: "Limpieza dental", frecuencia: "Semestral" },
      { nombre: "Obturation", frecuencia: "Según necesidad" },
      // Odontologia especializada
      { nombre: "Ortodoncia", frecuencia: "Cada 6 meses" },
      { nombre: "Endodoncia", frecuencia: "Según necesidad" },
      // Enfermeria y promocion
      { nombre: "Curaciones", frecuencia: "Diaria" },
      { nombre: "Vacunacion", frecuencia: "Segun calendario" },
      // Terapias
      { nombre: "Fisioterapia", frecuencia: "Semanal" },
      { nombre: "Psicologia", frecuencia: "Quincenal" },
      // Apoyo paramedico
      { nombre: "Analisis clinicos", frecuencia: "Semanal" },
      { nombre: "Rayos X", frecuencia: "Segun indicacion" },
      // Citologia
      { nombre: "Citologia", frecuencia: "Anual" },
      // Patologia
      { nombre: "Hematologia", frecuencia: "Segun necesidad" },
      // Laboratorio
      { nombre: "Bioquimica", frecuencia: "Diaria" },
      // Imagenologia
      { nombre: "Rayos X", frecuencia: "Segun necesidad" },
      { nombre: "Ecografia", frecuencia: "Segun necesidad" },
      // Otros procedimientos diagnostico y terapias
      { nombre: "Procedimiento diagnostico", frecuencia: "Segun necesidad" },
      { nombre: "Procedimiento terapia", frecuencia: "Segun necesidad" },
      // Cirugia
      { nombre: "Cirugia menor", frecuencia: "Segun necesidad" },
      { nombre: "Cirugia mayor", frecuencia: "Segun necesidad" },
      // Medicamentos
      { nombre: "Analgesicos", frecuencia: "Segun necesidad" },
      { nombre: "Vitaminas", frecuencia: "Diaria" },
      // PRG
      { nombre: "Prg basico", frecuencia: "Diaria" },
      { nombre: "Prg especial", frecuencia: "Semanal" },
    ]

    // Agrupar servicios por grupo
    // Definir qué servicio pertenece a qué grupo
    const gruposServicios: Record<GrupoServicio, string[]> = {
      "Medicina General": ["Consulta general", "Revision medica"],
      "Consulta especializada": ["Cardiologia", "Neumologia"],
      "Odontologia": ["Limpieza dental", "Obturation"],
      "Odontologia especializada": ["Ortodoncia", "Endodoncia"],
      "Enfermeria y promocion": ["Curaciones", "Vacunacion"],
      "Terapias": ["Fisioterapia", "Psicologia"],
      "Apoyo paramedico": ["Analisis clinicos", "Rayos X"],
      "Citologia": ["Citologia"],
      "Patologia": ["Hematologia"],
      "Laboratorio": ["Bioquimica"],
      "Imagenologia": ["Rayos X", "Ecografia"],
      "Otros procedimientos diagnostico y terapias": [
        "Procedimiento diagnostico",
        "Procedimiento terapia",
      ],
      "Cirugia": ["Cirugia menor", "Cirugia mayor"],
      "Medicamentos": ["Analgesicos", "Vitaminas"],
      "PRG": ["Prg basico", "Prg especial"],
    }

    for (const [grupo, nombres] of Object.entries(gruposServicios)) {
      const servicios: ServicioTabla[] = (nombres as string[]).map((nombre, index) => ({
        id: `${grupo}-${index}`,
        nombre,
        grupo: grupo as GrupoServicio,
        frecuencia_actual:
          serviciosEjemplo.find((s) => s.nombre === nombre)?.frecuencia || "",
        checked: true,
      }))
      mapa.set(grupo as GrupoServicio, servicios)
    }

    return mapa
  }, [])

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-semibold mb-6">Crear Planeación</h1>

      <form
        onSubmit={handleSubmit(async (data) => {
          setServerError(null)
          setIsSubmitting(true)
          try {
            const result = await crearPlaneacion(data)
            if (!result.ok) {
              setServerError(result.error)
              return
            }
            reset()
          } catch (error: any) {
            setServerError(error.message || "Error al guardar")
          } finally {
            setIsSubmitting(false)
          }
        })}
        className="space-y-6 w-full"
      >
        {/* Regional and Population section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Regional</label>
            <Select
              value={formValues.regional || ""}
              onValueChange={(value) => formSetValue("regional", value === "" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar regional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seleccione una regional</SelectItem>
                {opciones.regionales.map((regional) => (
                  <SelectItem key={regional.id} value={regional.nombre}>
                    {regional.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Población</label>
            <Input
              type="number"
              placeholder="Ingresar población"
              value={formValues.poblacion ?? ""}
              onChange={(e) => {
                const val = e.target.value
                if (val === "") {
                  formSetValue("poblacion", null)
                } else {
                  formSetValue("poblacion", Number(val))
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <Input
              placeholder="Nombre de la planeación"
              {...form.register("nombre")}
            />
            {errors.nombre?.message && (
              <p className="text-sm text-destructive">{String(errors.nombre.message)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Version</label>
            <Input
              type="number"
              placeholder="Version"
              {...form.register("version")}
              onChange={(e) => formSetValue("version", e.target.value || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Regimen</label>
            <Select
              value={formValues.regimen || ""}
              onValueChange={(value) => formSetValue("regimen", value === "" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar regimen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seleccione un regimen</SelectItem>
                {opciones.regimenes.map((regimen) => (
                  <SelectItem key={regimen.id} value={regimen.nombre}>
                    {regimen.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Asegurador</label>
            <Select
              value={formValues.asegurador || ""}
              onValueChange={(value) => formSetValue("asegurador", value === "" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar asegurador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Seleccione un asegurador</SelectItem>
                {opciones.aseguradores.map((asegurador) => (
                  <SelectItem key={asegurador.id} value={asegurador.nombre}>
                    {asegurador.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={formValues.tiene_nota_tecnica}
              onChange={(e) => formSetValue("tiene_nota_tecnica", e.target.checked)}
              className="rounded border-gray-300"
            />
            ¿Tener de referencia una nota técnica?
          </label>

          {formValues.tiene_nota_tecnica && (
            <div className="mt-4 p-4 border rounded-md space-y-3">
              <label className="block text-sm font-medium mb-2">Frecuencias de referencia</label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !formValues.frecuencias_referencia?.includes(value)) {
                    formSetValue("frecuencias_referencia", [
                      ...(formValues.frecuencias_referencia ?? []),
                      value,
                    ])
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Seleccionar frecuencia</SelectItem>
                  {frecuenciasReferencia.map((freq) => (
                    <SelectItem key={freq.id} value={freq.id}>
                      {freq.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formValues.frecuencias_referencia && formValues.frecuencias_referencia.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(formValues.frecuencias_referencia as string[]).map((freqId: string) => {
                    const freq = frecuenciasReferencia.find((f) => f.id === freqId)
                    return (
                      <Badge key={freqId} variant="secondary" className="gap-1">
                        {freq?.nombre || freqId}
                        <button
                          type="button"
                          onClick={() => {
                            formSetValue(
                              "frecuencias_referencia",
                              ((formValues.frecuencias_referencia as string[]) ?? []).filter((id: string) => id !== freqId)
                            )
                          }}
                          className="ml-1 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="font-medium mb-4">Servicios por agrupador</h2>

          {GRUPOS_SERVICIO.map((grupo) => (
            <Collapsible key={grupo} defaultOpen className="mb-3">
              <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 border rounded-t-md">
                <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{grupo}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-t-0 rounded-b-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar todos los servicios de ${grupo}`}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Valor Frecuencia</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviciosPorGrupo.get(grupo)?.map((servicio) => (
                        <TableRow key={servicio.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={servicio.checked}
                              onChange={() => {}}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>{servicio.nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              defaultValue={servicio.frecuencia_actual}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">Editar</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Planeación"}
        </Button>
      </form>
    </div>
  )
}
