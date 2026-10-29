"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import {
  actualizarContrato,
  crearContrato,
  crearDocumentoContrato,
} from "@/app/(dashboard)/contratos/actions"
import { ChoiceChips } from "@/components/shared/choice-chips"
import { MultiSelectChips } from "@/components/shared/multi-select-chips"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  calcularContrato,
  formatearMoneda,
  MODALIDADES,
  PERIODICIDADES,
  type Modalidad,
  type Periodicidad,
} from "@/lib/contratos/constantes"
import type {
  ContratoDetalle,
  OpcionesContrato,
} from "@/lib/contratos/queries"
import {
  contratoSchema,
  type ContratoInput,
} from "@/lib/validations/contrato"

type ContratoFormProps = {
  mode: "crear" | "editar" | "ver" | "crear_documento"
  contrato?: ContratoDetalle
  opciones: OpcionesContrato
  volverA?: string
  contratoId?: string
}

const REGIMEN_TOTAL = "__total__"

function opcionesItems(
  opciones: { id: string; label: string }[]
): Record<string, string> {
  return Object.fromEntries(
    opciones.map((opcion) => [opcion.id, opcion.label])
  )
}

function aNumeroONull(value: string) {
  return value === "" ? null : Number(value)
}

export function ContratoForm({
  mode,
  contrato,
  opciones,
  volverA = "/contratos",
  contratoId,
}: ContratoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [discriminarValores, setDiscriminarValores] = useState(
    (contrato?.valores.length ?? 0) > 0
  )
  const readonly = mode === "ver"
  const esDocumento = mode === "crear_documento"

  const aseguradoresItems = opcionesItems(
    opciones.aseguradores.map((asegurador) => ({
      id: asegurador.id,
      label: asegurador.nombre_eps,
    }))
  )

  const regionalesItems = opcionesItems(
    opciones.regionales.map((regional) => ({
      id: regional.id,
      label: regional.nombre,
    }))
  )

  const categoriasItems = opcionesItems(
    opciones.categorias.map((categoria) => ({
      id: categoria.id,
      label: categoria.nombre,
    }))
  )

  const tiposContratoItems = opcionesItems(
    opciones.tiposContrato.map((tipo) => ({
      id: tipo.id,
      label: tipo.nombre,
    }))
  )

  const estadosLegalizacionItems = opcionesItems(
    opciones.estadosLegalizacion.map((estado) => ({
      id: estado.id,
      label: estado.nombre,
    }))
  )

  const estadosEjecucionItems = opcionesItems(
    opciones.estadosEjecucion.map((estado) => ({
      id: estado.id,
      label: estado.nombre,
    }))
  )

  const regimenesItems = opcionesItems(
    opciones.regimenes.map((regimen) => ({
      id: regimen.id,
      label: regimen.nombre,
    }))
  )

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContratoInput>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      nombre: contrato?.nombre ?? "",
      asegurador_id: contrato?.asegurador_id ?? "",
      numero_contrato: contrato?.numero_contrato ?? "",
      regional_id:
        contrato?.regional_id ??
        (opciones.regionales.length === 1 ? opciones.regionales[0].id : ""),
      ciudad: contrato?.ciudad ?? "",
      modalidad: (contrato?.modalidad as Modalidad | undefined) ?? "capita",
      responsable_id: contrato?.responsable_id ?? "",
      categoria_contrato_id: contrato?.categoria_contrato_id ?? null,
      tipo_contrato_id: contrato?.tipo_contrato_id ?? null,
      estado_legalizacion_id: contrato?.estado_legalizacion_id ?? null,
      estado_ejecucion_id: contrato?.estado_ejecucion_id ?? null,
      fecha_inicio: contrato?.fecha_inicio ?? null,
      fecha_fin: contrato?.fecha_fin ?? null,
      prorroga_automatica: contrato?.prorroga_automatica ?? false,
      periodicidad:
        (contrato?.periodicidad as Periodicidad | undefined) ?? "mensual",
      poblacion_total: contrato?.poblacion_total ?? null,
      valor_total: contrato?.valor_total ?? null,
      valor_percapita_manual: contrato?.valor_percapita_manual ?? null,
      tiene_programas: contrato?.tiene_programas ?? false,
      sede_ids: contrato?.sedes.map((sede) => sede.sede_id) ?? [],
      programa_ids:
        contrato?.programas.map((programa) => programa.opcion_id) ?? [],
      valores:
        contrato?.valores.map((valor) => ({
          regimen_id: valor.regimen_id,
          poblacion: valor.poblacion,
          valor_total: valor.valor_total,
          valor_percapita_manual: valor.valor_percapita_manual,
        })) ?? [],
      url_ubicacion: contrato?.url_ubicacion ?? null,
      notas: contrato?.notas ?? null,
      tipo_documento: null,
      numero_documento: null,
      fecha_otorgamiento: null,
      archivo_url: null,
      resumen_cambios: null,
      contrato_id: contrato?.id ?? null,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "valores",
  })

  const regionalId = useWatch({ control, name: "regional_id" })
  const periodicidad = useWatch({ control, name: "periodicidad" })
  const poblacionTotal = useWatch({ control, name: "poblacion_total" })
  const valorTotal = useWatch({ control, name: "valor_total" })
  const valorPercapitaManual = useWatch({
    control,
    name: "valor_percapita_manual",
  })
  const tieneProgramas = useWatch({ control, name: "tiene_programas" })
  const valores = useWatch({ control, name: "valores" })

  const responsablesDisponibles = opciones.responsables

  const responsablesItems = opcionesItems(
    responsablesDisponibles.map((responsable) => ({
      id: responsable.id,
      label: responsable.nombre,
    }))
  )

  const regionalNombre = useMemo(
    () =>
      opciones.regionales.find((regional) => regional.id === regionalId)
        ?.nombre ?? null,
    [opciones.regionales, regionalId]
  )

  const sedesDisponibles = useMemo(() => {
    if (!regionalNombre) return []
    const regionalObjetivo = regionalNombre.trim().toLowerCase()
    return opciones.sedes.filter(
      (sede) => sede.regional?.trim().toLowerCase() === regionalObjetivo
    )
  }, [opciones.sedes, regionalNombre])

  const calculos = useMemo(
    () =>
      calcularContrato(
        {
          periodicidad: periodicidad ?? null,
          poblacion_total: poblacionTotal ?? null,
          valor_total: valorTotal ?? null,
          valor_percapita_manual: valorPercapitaManual ?? null,
        },
        discriminarValores
          ? (valores ?? []).map((valor) => ({
              regimen_id: valor.regimen_id,
              poblacion: valor.poblacion,
              valor_total: valor.valor_total,
              valor_percapita_manual: valor.valor_percapita_manual,
            }))
          : []
      ),
    [
      periodicidad,
      poblacionTotal,
      valorTotal,
      valorPercapitaManual,
      discriminarValores,
      valores,
    ]
  )

  async function onSubmit(values: ContratoInput) {
    if (readonly) return

    setServerError(null)

    const normalizado: ContratoInput = {
      ...values,
      programa_ids: values.tiene_programas ? values.programa_ids : [],
      valores: discriminarValores ? values.valores : [],
    }

    let result: any = null
    if (esDocumento && contratoId) {
      const meta = {
        tipo_documento: normalizado.tipo_documento as any,
        numero_documento: normalizado.numero_documento ?? "",
        fecha_otorgamiento: normalizado.fecha_otorgamiento ?? null,
        archivo_url: normalizado.archivo_url ?? "",
        resumen_cambios: normalizado.resumen_cambios ?? null,
      }
      result = await crearDocumentoContrato(contratoId, normalizado, meta)
    } else if (mode === "editar" && contrato) {
      result = await actualizarContrato(contrato.id, normalizado)
    } else {
      result = await crearContrato(normalizado)
    }

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push(volverA)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Datos del contrato</CardTitle>
          <CardDescription>
            Identificación, asegurador y clasificación del contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.nombre}>
              <FieldLabel htmlFor="nombre">Nombre del contrato</FieldLabel>
              <Input
                id="nombre"
                autoComplete="off"
                disabled={readonly}
                aria-invalid={!!errors.nombre}
                {...register("nombre")}
              />
              <FieldError errors={[errors.nombre]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.numero_contrato}>
                <FieldLabel htmlFor="numero_contrato">
                  Número de contrato
                </FieldLabel>
                <Input
                  id="numero_contrato"
                  autoComplete="off"
                  disabled={readonly}
                  aria-invalid={!!errors.numero_contrato}
                  {...register("numero_contrato")}
                />
                <FieldError errors={[errors.numero_contrato]} />
              </Field>

              <Field data-invalid={!!errors.asegurador_id}>
                <FieldLabel>Asegurador</FieldLabel>
                <Controller
                  control={control}
                  name="asegurador_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={aseguradoresItems}
                      disabled={readonly}
                    >
                      <SelectTrigger
                        id="asegurador_id"
                        className="w-full"
                        aria-invalid={!!errors.asegurador_id}
                      >
                        <SelectValue placeholder="Selecciona el asegurador" />
                      </SelectTrigger>
                      <SelectContent>
                        {opciones.aseguradores.map((asegurador) => (
                          <SelectItem
                            key={asegurador.id}
                            value={asegurador.id}
                          >
                            {asegurador.nombre_eps}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.asegurador_id]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.categoria_contrato_id}>
                <FieldLabel>Categoría del contrato</FieldLabel>
                <Controller
                  control={control}
                  name="categoria_contrato_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={categoriasItems}
                      disabled={readonly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona la categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {opciones.categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.categoria_contrato_id]} />
              </Field>

              <Field data-invalid={!!errors.tipo_contrato_id}>
                <FieldLabel>Tipo de contrato</FieldLabel>
                <Controller
                  control={control}
                  name="tipo_contrato_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={tiposContratoItems}
                      disabled={readonly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {opciones.tiposContrato.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.tipo_contrato_id]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.modalidad}>
              <FieldLabel>Modalidad</FieldLabel>
              <Controller
                control={control}
                name="modalidad"
                render={({ field }) => (
                  <ChoiceChips
                    options={MODALIDADES.map((modalidad) => ({
                      value: modalidad.value,
                      label: modalidad.label,
                    }))}
                    value={field.value}
                    onChange={(value) =>
                      field.onChange(value as Modalidad)
                    }
                    disabled={readonly}
                  />
                )}
              />
              <FieldError errors={[errors.modalidad]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Asignación y cobertura</CardTitle>
          <CardDescription>
            Regional, ciudad, gerente regional y sedes a las que presta el
            servicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.regional_id}>
                <FieldLabel>Regional</FieldLabel>
                <Controller
                  control={control}
                  name="regional_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setValue("sede_ids", [])
                      }}
                      items={regionalesItems}
                      disabled={readonly}
                    >
                      <SelectTrigger
                        id="regional_id"
                        className="w-full"
                        aria-invalid={!!errors.regional_id}
                      >
                        <SelectValue placeholder="Selecciona la regional" />
                      </SelectTrigger>
                      <SelectContent>
                        {opciones.regionales.map((regional) => (
                          <SelectItem key={regional.id} value={regional.id}>
                            {regional.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.regional_id]} />
              </Field>

              <Field data-invalid={!!errors.ciudad}>
                <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
                <Input
                  id="ciudad"
                  autoComplete="off"
                  disabled={readonly}
                  aria-invalid={!!errors.ciudad}
                  {...register("ciudad")}
                />
                <FieldError errors={[errors.ciudad]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.responsable_id}>
              <FieldLabel>Responsable</FieldLabel>
              <Controller
                control={control}
                name="responsable_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={responsablesItems}
                    disabled={
                      readonly || responsablesDisponibles.length === 0
                    }
                  >
                    <SelectTrigger
                      id="responsable_id"
                      className="w-full"
                      aria-invalid={!!errors.responsable_id}
                    >
                      <SelectValue placeholder="Selecciona el responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsablesDisponibles.map((responsable) => (
                        <SelectItem
                          key={responsable.id}
                          value={responsable.id}
                        >
                          {responsable.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.responsable_id]} />
            </Field>

            <Field data-invalid={!!errors.sede_ids}>
              <FieldLabel>Sedes cubiertas</FieldLabel>
              {regionalId ? (
                <Controller
                  control={control}
                  name="sede_ids"
                  render={({ field }) => (
                    <MultiSelectChips
                      options={sedesDisponibles.map((sede) => ({
                        value: sede.id,
                        label: sede.nombre,
                        hint: sede.municipio ?? undefined,
                      }))}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={readonly}
                      emptyMessage="No hay sedes activas para la regional seleccionada"
                    />
                  )}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona una regional para ver las sedes disponibles.
                </p>
              )}
              <FieldError errors={[errors.sede_ids]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Legalización y ejecución
          </CardTitle>
          <CardDescription>
            Estado de legalización y estado de ejecución del contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.estado_legalizacion_id}>
              <FieldLabel>Estado de legalización</FieldLabel>
              <Controller
                control={control}
                name="estado_legalizacion_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={estadosLegalizacionItems}
                    disabled={readonly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.estadosLegalizacion.map((estado) => (
                        <SelectItem key={estado.id} value={estado.id}>
                          {estado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.estado_legalizacion_id]} />
            </Field>

            <Field data-invalid={!!errors.estado_ejecucion_id}>
              <FieldLabel>Estado del contrato</FieldLabel>
              <Controller
                control={control}
                name="estado_ejecucion_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={estadosEjecucionItems}
                    disabled={readonly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.estadosEjecucion.map((estado) => (
                        <SelectItem key={estado.id} value={estado.id}>
                          {estado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.estado_ejecucion_id]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Vigencia y valores</CardTitle>
          <CardDescription>
            Fechas, periodicidad, población y valores del contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.fecha_inicio}>
                <FieldLabel htmlFor="fecha_inicio">Fecha de inicio</FieldLabel>
                <Input
                  id="fecha_inicio"
                  type="date"
                  disabled={readonly}
                  aria-invalid={!!errors.fecha_inicio}
                  {...register("fecha_inicio", {
                    setValueAs: (value) => (value === "" ? null : value),
                  })}
                />
                <FieldError errors={[errors.fecha_inicio]} />
              </Field>

              <Field data-invalid={!!errors.fecha_fin}>
                <FieldLabel htmlFor="fecha_fin">Fecha de fin</FieldLabel>
                <Input
                  id="fecha_fin"
                  type="date"
                  disabled={readonly}
                  aria-invalid={!!errors.fecha_fin}
                  {...register("fecha_fin", {
                    setValueAs: (value) => (value === "" ? null : value),
                  })}
                />
                <FieldError errors={[errors.fecha_fin]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.periodicidad}>
              <FieldLabel>Periodicidad</FieldLabel>
              <Controller
                control={control}
                name="periodicidad"
                render={({ field }) => (
                  <ChoiceChips
                    options={PERIODICIDADES.map((periodicidad) => ({
                      value: periodicidad.value,
                      label: periodicidad.label,
                    }))}
                    value={field.value ?? ""}
                    onChange={(value) =>
                      field.onChange(value as Periodicidad)
                    }
                    disabled={readonly}
                  />
                )}
              />
              <FieldError errors={[errors.periodicidad]} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                control={control}
                name="prorroga_automatica"
                render={({ field }) => (
                  <Switch
                    id="prorroga_automatica"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={readonly}
                  />
                )}
              />
              <FieldLabel htmlFor="prorroga_automatica">
                Cuenta con prórroga automática
              </FieldLabel>
            </Field>

            <Field orientation="horizontal">
              <Switch
                id="discriminar_valores"
                checked={discriminarValores}
                onCheckedChange={setDiscriminarValores}
                disabled={readonly}
              />
              <FieldLabel htmlFor="discriminar_valores">
                Discriminar valores por régimen
              </FieldLabel>
            </Field>

            {discriminarValores ? (
              <Field data-invalid={!!errors.valores}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel>Valores por régimen</FieldLabel>
                  {!readonly ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          regimen_id: null,
                          poblacion: null,
                          valor_total: null,
                          valor_percapita_manual: null,
                        })
                      }
                    >
                      <PlusIcon />
                      Agregar régimen
                    </Button>
                  ) : null}
                </div>

                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Agrega al menos un régimen con su población y valor.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Régimen</TableHead>
                        <TableHead>Población</TableHead>
                        <TableHead>Valor total</TableHead>
                        <TableHead>Per cápita manual</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((fila, index) => (
                        <TableRow key={fila.id}>
                          <TableCell className="min-w-44">
                            <Controller
                              control={control}
                              name={`valores.${index}.regimen_id`}
                              render={({ field }) => (
                                <Select
                                  value={field.value ?? REGIMEN_TOTAL}
                                  onValueChange={(value) =>
                                    field.onChange(
                                      value === REGIMEN_TOTAL ? null : value
                                    )
                                  }
                                  items={{
                                    [REGIMEN_TOTAL]: "Total / sin régimen",
                                    ...regimenesItems,
                                  }}
                                  disabled={readonly}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Régimen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={REGIMEN_TOTAL}>
                                      Total / sin régimen
                                    </SelectItem>
                                    {opciones.regimenes.map((regimen) => (
                                      <SelectItem
                                        key={regimen.id}
                                        value={regimen.id}
                                      >
                                        {regimen.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              disabled={readonly}
                              {...register(`valores.${index}.poblacion`, {
                                setValueAs: aNumeroONull,
                              })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              disabled={readonly}
                              {...register(`valores.${index}.valor_total`, {
                                setValueAs: aNumeroONull,
                              })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              disabled={readonly}
                              {...register(
                                `valores.${index}.valor_percapita_manual`,
                                { setValueAs: aNumeroONull }
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {!readonly ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <Trash2Icon />
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <FieldError errors={[errors.valores?.root]} />
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.poblacion_total}>
                  <FieldLabel htmlFor="poblacion_total">
                    Población asignada total
                  </FieldLabel>
                  <Input
                    id="poblacion_total"
                    type="number"
                    min={0}
                    step={1}
                    disabled={readonly}
                    aria-invalid={!!errors.poblacion_total}
                    {...register("poblacion_total", {
                      setValueAs: aNumeroONull,
                    })}
                  />
                  <FieldError errors={[errors.poblacion_total]} />
                </Field>

                <Field data-invalid={!!errors.valor_total}>
                  <FieldLabel htmlFor="valor_total">
                    Valor total del contrato
                  </FieldLabel>
                  <Input
                    id="valor_total"
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={readonly}
                    aria-invalid={!!errors.valor_total}
                    {...register("valor_total", { setValueAs: aNumeroONull })}
                  />
                  <FieldError errors={[errors.valor_total]} />
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.valor_percapita_manual}>
                <FieldLabel htmlFor="valor_percapita_manual">
                  Valor per cápita manual
                </FieldLabel>
                <Input
                  id="valor_percapita_manual"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={readonly}
                  aria-invalid={!!errors.valor_percapita_manual}
                  {...register("valor_percapita_manual", {
                    setValueAs: aNumeroONull,
                  })}
                />
                <FieldError errors={[errors.valor_percapita_manual]} />
              </Field>

              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p className="mb-2 font-medium">Valores calculados</p>
                <dl className="grid gap-1">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Población total</dt>
                    <dd>{calculos.poblacionTotal}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Valor total</dt>
                    <dd>{formatearMoneda(calculos.valorTotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Valor mensual</dt>
                    <dd>{formatearMoneda(calculos.valorMensual)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Per cápita calculado
                    </dt>
                    <dd>{formatearMoneda(calculos.valorPercapitaCalculado)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 font-medium">
                    <dt>Per cápita aplicado</dt>
                    <dd>{formatearMoneda(calculos.valorPercapita)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Programas y observaciones
          </CardTitle>
          <CardDescription>
            Programas asociados, ubicación y notas del contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field orientation="horizontal">
              <FieldLabel htmlFor="tiene_programas">
                Cuenta con programas
              </FieldLabel>
              <Controller
                control={control}
                name="tiene_programas"
                render={({ field }) => (
                  <Switch
                    id="tiene_programas"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (!checked) setValue("programa_ids", [])
                    }}
                    disabled={readonly}
                  />
                )}
              />
            </Field>

            {tieneProgramas ? (
              <Field data-invalid={!!errors.programa_ids}>
                <FieldLabel>Programas</FieldLabel>
                <Controller
                  control={control}
                  name="programa_ids"
                  render={({ field }) => (
                    <MultiSelectChips
                      options={opciones.programas.map((programa) => ({
                        value: programa.id,
                        label: programa.nombre,
                      }))}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={readonly}
                      emptyMessage="No hay programas configurados"
                    />
                  )}
                />
                <FieldError errors={[errors.programa_ids]} />
              </Field>
            ) : null}

            <Field data-invalid={!!errors.url_ubicacion}>
              <FieldLabel htmlFor="url_ubicacion">
                URL de ubicación del contrato
              </FieldLabel>
              <Input
                id="url_ubicacion"
                type="url"
                placeholder="https://..."
                disabled={readonly}
                aria-invalid={!!errors.url_ubicacion}
                {...register("url_ubicacion")}
              />
              <FieldError errors={[errors.url_ubicacion]} />
            </Field>

            <Field data-invalid={!!errors.notas}>
              <FieldLabel htmlFor="notas">Notas y observaciones</FieldLabel>
              <Textarea
                id="notas"
                rows={4}
                disabled={readonly}
                aria-invalid={!!errors.notas}
                {...register("notas")}
              />
              <FieldError errors={[errors.notas]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {esDocumento ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Documento modificatorio / Otrosí / Anexo</CardTitle>
            <CardDescription>
              Datos del documento que modifica el contrato vigente (URL de OneDrive, número y comentario).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.tipo_documento}>
                <FieldLabel>Tipo de documento</FieldLabel>
                <Controller
                  control={control}
                  name="tipo_documento"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      items={{
                        primigenio: "Primigenio",
                        modificatorio: "Modificatorio",
                        otro_si: "Otro sí",
                        anexo: "Anexo",
                      }}
                      disabled={readonly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primigenio">Primigenio</SelectItem>
                        <SelectItem value="modificatorio">Modificatorio</SelectItem>
                        <SelectItem value="otro_si">Otro sí</SelectItem>
                        <SelectItem value="anexo">Anexo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.tipo_documento]} />
              </Field>

              <Field data-invalid={!!errors.numero_documento}>
                <FieldLabel htmlFor="numero_documento">Número del documento</FieldLabel>
                <Input
                  id="numero_documento"
                  autoComplete="off"
                  disabled={readonly}
                  aria-invalid={!!errors.numero_documento}
                  {...register("numero_documento")}
                  placeholder="Ej. MOD-001"
                />
                <FieldError errors={[errors.numero_documento]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.fecha_otorgamiento}>
                <FieldLabel htmlFor="fecha_otorgamiento">Fecha de otorgamiento</FieldLabel>
                <Input
                  id="fecha_otorgamiento"
                  type="date"
                  disabled={readonly}
                  aria-invalid={!!errors.fecha_otorgamiento}
                  {...register("fecha_otorgamiento", {
                    setValueAs: (value: string) => (value === "" ? null : value),
                  })}
                />
                <FieldError errors={[errors.fecha_otorgamiento]} />
              </Field>

              <Field data-invalid={!!errors.archivo_url}>
                <FieldLabel htmlFor="archivo_url">URL del archivo (OneDrive pública)</FieldLabel>
                <Input
                  id="archivo_url"
                  type="url"
                  disabled={readonly}
                  aria-invalid={!!errors.archivo_url}
                  {...register("archivo_url")}
                  placeholder="https://onedrive.live.com/..."
                />
                <FieldError errors={[errors.archivo_url]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.resumen_cambios}>
              <FieldLabel htmlFor="resumen_cambios">Comentario / Resumen de cambios</FieldLabel>
              <Textarea
                id="resumen_cambios"
                rows={3}
                disabled={readonly}
                aria-invalid={!!errors.resumen_cambios}
                {...register("resumen_cambios")}
                placeholder="Ej. Cambio de valor a 6500, actualización de fechas..."
              />
              <FieldError errors={[errors.resumen_cambios]} />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end gap-2">
        <Link
          href={volverA}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Volver
        </Link>
        {mode !== "ver" ? (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {esDocumento ? "Guardar documento" : mode === "crear" ? "Crear contrato" : "Guardar cambios"}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
