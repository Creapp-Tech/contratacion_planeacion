"use client";

import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { obtenerServiciosFrecuenciaAction } from "@/lib/infraestructura-personal/actions";
import type {
  EspacioId,
  InfraestructuraPersonalOpciones,
  PlaneacionServicio,
} from "@/lib/infraestructura-personal/types";
import { BorradorBanner } from "./borrador-banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ESPACIOS: { id: EspacioId; label: string; descripcion: string }[] = [
  {
    id: "sala_procedimiento",
    label: "Sala de procedimiento",
    descripcion: "Espacio para procedimientos clínicos.",
  },
  {
    id: "farmacia",
    label: "Farmacia",
    descripcion: "Dispensación de medicamentos en la sede.",
  },
  {
    id: "sala_espera_pac",
    label: "Sala Espera PAC",
    descripcion: "Sala de espera para pacientes de alto costo.",
  },
  {
    id: "trabajo_social",
    label: "Trabajo Social",
    descripcion: "Atención de trabajo social.",
  },
  {
    id: "sala_era",
    label: "Sala ERA",
    descripcion: "Espacio de atención especializada ERA.",
  },
];

const formSchema = z.object({
  tipo_sede: z.enum(["nueva", "antigua"]),
  asegurador_id: z.string().min(1, "Selecciona el asegurador"),
  asegurador_nombre: z.string(),
  regimen_id: z.string().min(1, "Selecciona el régimen"),
  regimen_nombre: z.string(),
  regional_nombre: z.string().min(1, "Selecciona la regional"),
  zonal_nombre: z.string().min(1, "Selecciona la zonal"),
  sede_id: z.string().optional(),
  sede_nombre: z.string().optional(),
  espacios: z.record(z.string(), z.boolean()),
  usar_frecuencias_referencia: z.boolean().default(false),
  frecuencia_referencia_id: z.string().optional(),
  frecuencia_referencia_nombre: z.string().optional(),
  servicios: z.array(
    z.object({
      servicio_id: z.string(),
      nombre: z.string(),
      grupo_id: z.string().nullable(),
      grupo_nombre: z.string().nullable(),
      tipo_personal: z.string(),
      duracion_minutos: z.number().nullable(),
      seleccionado: z.boolean(),
      frecuencia: z.number().nullable(),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

type InfraestructuraPersonalFormProps = {
  opciones: InfraestructuraPersonalOpciones;
};

const ESPACIOS_INICIALES: Record<EspacioId, boolean> = {
  sala_procedimiento: false,
  farmacia: false,
  sala_espera_pac: false,
  trabajo_social: false,
  sala_era: false,
};

export function InfraestructuraPersonalForm({
  opciones,
}: InfraestructuraPersonalFormProps) {
  const [borradorGuardado, setBorradorGuardado] = useState(false);
  const [guardadoMensaje, setGuardadoMensaje] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [precargando, setPrecargando] = useState(false);
  const precargaRef = useRef<Record<string, number>>({});

  const valoresIniciales: FormValues = {
    tipo_sede: "antigua",
    asegurador_id: "",
    asegurador_nombre: "",
    regimen_id: "",
    regimen_nombre: "",
    regional_nombre: "",
    zonal_nombre: "",
    sede_id: undefined,
    sede_nombre: undefined,
    espacios: { ...ESPACIOS_INICIALES },
    usar_frecuencias_referencia: false,
    frecuencia_referencia_id: undefined,
    frecuencia_referencia_nombre: undefined,
    servicios: opciones.serviciosAgrupados.flatMap((grupo) =>
      grupo.servicios.map((servicio) => ({
        servicio_id: servicio.id,
        nombre: servicio.nombre,
        grupo_id: servicio.grupo_id ?? null,
        grupo_nombre: grupo.nombre,
        tipo_personal: servicio.tipo_personal,
        duracion_minutos: servicio.duracion_minutos ?? null,
        seleccionado: false,
        frecuencia: null,
      }))
    ),
  };

  const form = useForm<FormValues>({
    defaultValues: valoresIniciales,
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    setValue,
    watch,
  } = form;

  const [serviciosItems, setServiciosItems] = useState<PlaneacionServicio[]>(
    valoresIniciales.servicios
  );

  const tipoSede = watch("tipo_sede");
  const usarRef = watch("usar_frecuencias_referencia");
  const frecuenciaRefId = watch("frecuencia_referencia_id");

  const opcionesAsegurador = useMemo(
    () =>
      opciones.aseguradores.map((a) => ({
        value: a.id,
        label: a.nombre,
      })),
    [opciones.aseguradores]
  );
  const opcionesRegimen = useMemo(
    () =>
      opciones.regímenes.map((r) => ({
        value: r.id,
        label: r.nombre,
      })),
    [opciones.regímenes]
  );
  const opcionesRegional = useMemo(
    () => opciones.regionales.map((r) => ({ value: r, label: r })),
    [opciones.regionales]
  );
  const opcionesZonal = useMemo(
    () => opciones.zonales.map((z) => ({ value: z, label: z })),
    [opciones.zonales]
  );
  const opcionesSede = useMemo(
    () =>
      opciones.sedes.map((s) => ({
        value: s.id,
        label: s.nombre,
      })),
    [opciones.sedes]
  );

  async function onSeleccionarFrecuenciaReferencia(
    id: string | undefined
  ) {
    if (!id) {
      setValue("frecuencia_referencia_id", undefined);
      setValue("frecuencia_referencia_nombre", undefined);
      precargaRef.current = {};
      return;
    }

    setPrecargando(true);
    setErrorGuardado(null);
    try {
      const mapa = await obtenerServiciosFrecuenciaAction(id);
      precargaRef.current = mapa;

      const op = opciones.frecuenciasNotaTecnica.find((f) => f.id === id);
      setValue("frecuencia_referencia_id", id);
      setValue("frecuencia_referencia_nombre", op?.nombre ?? undefined);

      setServiciosItems((prev) =>
        prev.map((s) => {
          const freq = mapa[s.servicio_id];
          return freq !== undefined ? { ...s, frecuencia: freq } : s;
        })
      );
    } catch (error) {
      setErrorGuardado(
        error instanceof Error
          ? error.message
          : "No se pudieron precargar las frecuencias de referencia."
      );
    } finally {
      setPrecargando(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setErrorGuardado(null);
    setGuardadoMensaje(null);

    // Validación con zod (sin resolver, para evitar conflictos de tipos con zod v4).
    let parsed: FormValues;
    try {
      parsed = formSchema.parse(values);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          const path = err.path.join(".");
          form.setError(path as any, { message: err.message });
        });
      }
      setErrorGuardado("Corrige los errores del formulario.");
      return;
    }

    try {
      // Simula retardo de red para feedback visual (no persiste en BD).
      await new Promise((resolve) => setTimeout(resolve, 900));

      const serviciosSeleccionados = serviciosItems.filter(
      (s) => s.seleccionado
    );

    const payload = {
        id: `borrador-${Date.now()}`,
        tipo_sede: parsed.tipo_sede,
        tipo_sede_label:
          parsed.tipo_sede === "nueva" ? "Sede nueva" : "Sede antigua",
        asegurador: {
          id: parsed.asegurador_id,
          nombre: parsed.asegurador_nombre,
        },
        regimen: {
          id: parsed.regimen_id,
          nombre: parsed.regimen_nombre,
        },
        regional: {
          nombre: parsed.regional_nombre,
        },
        zonal: {
          nombre: parsed.zonal_nombre,
        },
        sede:
          parsed.tipo_sede === "antigua"
            ? {
                id: parsed.sede_id ?? undefined,
                nombre:
                  opciones.sedes.find((s) => s.id === parsed.sede_id)
                    ?.nombre ?? "",
              }
            : {
                id: undefined,
                nombre: parsed.sede_nombre ?? undefined,
              },
        espacios: parsed.espacios,
        espacios_seleccionados: Object.entries(parsed.espacios)
          .filter(([, activo]) => activo)
          .map(([id]) => id),
        usar_frecuencias_referencia: parsed.usar_frecuencias_referencia,
        frecuencia_referencia:
          parsed.frecuencia_referencia_id
            ? {
                id: parsed.frecuencia_referencia_id,
                nombre: parsed.frecuencia_referencia_nombre ?? "",
              }
            : undefined,
        servicios: serviciosSeleccionados.map((s) => ({
          servicio_id: s.servicio_id,
          nombre: s.nombre,
          grupo_id: s.grupo_id,
          grupo_nombre: s.grupo_nombre,
          tipo_personal: s.tipo_personal,
          frecuencia: s.frecuencia,
        })),
      };

      console.log(
        "[infraestructura-personal] Payload borrador (sin envío a base de datos):",
        JSON.stringify(payload, null, 2)
      );

      setBorradorGuardado(true);
      setGuardadoMensaje(
        "Los cambios se guardaron en borrador local. El flujo está pendiente de confirmación de persistencia (no se envió a base de datos)."
      );
    } catch (error) {
      setErrorGuardado(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al armar el borrador."
      );
    }
  }

  const serviciosSeleccionadosCount = serviciosItems.filter(
    (s) => s.seleccionado
  ).length;
  const totalApoyos = Object.values(getValuesEspacios()).filter(Boolean)
    .length;

  function getValuesEspacios() {
    return form.getValues("espacios");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {errorGuardado ? (
        <Alert variant="destructive">
          <AlertDescription>{errorGuardado}</AlertDescription>
        </Alert>
      ) : null}

      {/* Sección A: Tipo de sede y ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            A. Tipo de sede y ubicación
          </CardTitle>
          <CardDescription>
            Define si la sede es nueva o antigua y sus datos de ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.tipo_sede}>
            <FieldLabel>Tipo de sede</FieldLabel>
            <Controller
              control={control}
              name="tipo_sede"
              render={({ field }) => (
                <div className="flex gap-2">
                  {["antigua", "nueva"].map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      role="radio"
                      aria-checked={field.value === valor}
                      onClick={() => {
                        field.onChange(valor as "nueva" | "antigua");
                        if (valor === "nueva") {
                          setValue("sede_id", undefined);
                        } else {
                          setValue("sede_nombre", undefined);
                        }
                      }}
                      className={
                        field.value === valor
                          ? "flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors bg-primary text-primary-foreground border-primary"
                          : "flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors bg-input text-foreground border-input hover:bg-muted/50"
                      }
                    >
                      {valor === "antigua" ? "Sede antigua" : "Sede nueva"}
                    </button>
                  ))}
                </div>
              )}
            />
            <FieldError errors={[errors.tipo_sede]} />
          </Field>

          <Field data-invalid={!!errors.asegurador_id}>
            <FieldLabel htmlFor="asegurador_id">Asegurador</FieldLabel>
            <Controller
              control={control}
              name="asegurador_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const op = opciones.aseguradores.find(
                      (a) => a.id === value
                    );
                    setValue("asegurador_nombre", op?.nombre ?? "");
                  }}
                  items={opcionesAsegurador}
                >
                  <SelectTrigger id="asegurador_id" className="w-full">
                    <SelectValue placeholder="Selecciona el asegurador" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionesAsegurador.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.asegurador_id]} />
          </Field>

          <Field data-invalid={!!errors.regimen_id}>
            <FieldLabel htmlFor="regimen_id">Régimen</FieldLabel>
            <Controller
              control={control}
              name="regimen_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const op = opciones.regímenes.find((r) => r.id === value);
                    setValue("regimen_nombre", op?.nombre ?? "");
                  }}
                  items={opcionesRegimen}
                >
                  <SelectTrigger id="regimen_id" className="w-full">
                    <SelectValue placeholder="Selecciona el régimen" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionesRegimen.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.regimen_id]} />
          </Field>

          <Field data-invalid={!!errors.regional_nombre}>
            <FieldLabel htmlFor="regional_nombre">Regional</FieldLabel>
            <Controller
              control={control}
              name="regional_nombre"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={opcionesRegional}
                >
                  <SelectTrigger id="regional_nombre" className="w-full">
                    <SelectValue placeholder="Selecciona la regional" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionesRegional.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.regional_nombre]} />
          </Field>

          <Field data-invalid={!!errors.zonal_nombre}>
            <FieldLabel htmlFor="zonal_nombre">Zonal</FieldLabel>
            <Controller
              control={control}
              name="zonal_nombre"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={opcionesZonal}
                >
                  <SelectTrigger id="zonal_nombre" className="w-full">
                    <SelectValue placeholder="Selecciona la zonal" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionesZonal.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.zonal_nombre]} />
          </Field>

          {tipoSede === "antigua" ? (
            <Field data-invalid={!!errors.sede_id}>
              <FieldLabel htmlFor="sede_id">Sede existente</FieldLabel>
              <Controller
                control={control}
                name="sede_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value || undefined);
                      const op = opciones.sedes.find((s) => s.id === value);
                      setValue("sede_nombre", op?.nombre ?? undefined);
                    }}
                    items={opcionesSede}
                  >
                    <SelectTrigger id="sede_id" className="w-full">
                      <SelectValue
                        placeholder="Selecciona la sede existente"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {opcionesSede.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.sede_id]} />
            </Field>
          ) : (
            <Field data-invalid={!!errors.sede_nombre}>
              <FieldLabel htmlFor="sede_nombre">
                Nombre de la nueva sede
              </FieldLabel>
              <Input
                id="sede_nombre"
                placeholder="Ej. Clínica Nuevo Amanecer"
                {...register("sede_nombre")}
                aria-invalid={!!errors.sede_nombre}
              />
              <FieldError errors={[errors.sede_nombre]} />
            </Field>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Sección B: Espacios y áreas complementarias */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            B. Espacios y áreas complementarias
          </CardTitle>
          <CardDescription>
            Indica si se requieren los siguientes espacios en la sede.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {ESPACIOS.map((espacio) => {
            const id = espacio.id;
            const checked = Boolean(
              form.getValues("espacios")?.[id] ?? false
            );
            return (
              <div
                key={id}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
              >
                <Controller
                  control={control}
                  name={`espacios.${id}`}
                  render={({ field }) => (
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        className="size-5"
                      />
                      <span className="text-sm font-medium">
                        {espacio.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {espacio.descripcion}
                      </span>
                    </label>
                  )}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* Sección C: Frecuencias de referencia (Nota Técnica) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            C. Frecuencias de referencia (Nota Técnica)
          </CardTitle>
          <CardDescription>
            Activa para usar una frecuencia de referencia clasificada como
            NOTA TÉCNICA y precargar sus valores en los servicios.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Controller
              control={control}
              name="usar_frecuencias_referencia"
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="size-5"
                  />
                  <span className="text-sm font-medium">
                    Usar frecuencias de referencia (NOTA TÉCNICA)
                  </span>
                </label>
              )}
            />
          </Field>

          {usarRef ? (
            <div className="flex flex-col gap-2">
              <FieldLabel>
                Frecuencia de referencia (NOTA TÉCNICA)
              </FieldLabel>
              <Controller
                control={control}
                name="frecuencia_referencia_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      onSeleccionarFrecuenciaReferencia(
                        value || undefined
                      )}
                  >
                    <SelectTrigger
                      id="frecuencia_referencia_id"
                      className="w-full"
                      disabled={
                        !opciones.frecuenciasNotaTecnica.length
                      }
                    >
                      <SelectValue
                        placeholder="Selecciona una nota técnica"
                      >
                        {opciones.frecuenciasNotaTecnica.find(
                          (f) => f.id === field.value
                        )?.nombre}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {!opciones.frecuenciasNotaTecnica.length ? (
                        <SelectItem disabled>
                          No hay frecuencias NOTA TÉCNICA disponibles
                        </SelectItem>
                      ) : (
                        opciones.frecuenciasNotaTecnica.map((f) => (
                          <SelectItem
                            key={f.id}
                            value={f.id}
                            className="text-sm"
                          >
                            <div className="font-medium">{f.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {f.sede_nombre} · {f.regional ?? "—"} ·
                              {f.asegurador_nombre} · v{f.version}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {frecuenciaRefId && Object.keys(precargaRef.current).length > 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  Precargado en{" "}
                  {Object.keys(precargaRef.current).length} servicio(s)
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Separator />

      {/* Sección D: Conformación de servicios a prestar */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            D. Conformación de servicios a prestar
          </CardTitle>
          <CardDescription>
            Selecciona los servicios que se prestarán en esta planeación y ajusta
            su frecuencia si es necesario.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              {serviciosSeleccionadosCount} servicio{
                serviciosSeleccionadosCount !== 1 ? "s" : ""
              } seleccionado{
                serviciosSeleccionadosCount !== 1 ? "s" : ""
              }
            </span>
            <span className="text-muted-foreground">
              {totalApoyos} apoyo/apoyos de espacio(s)
            </span>
          </div>

          <div className="space-y-2">
            {opciones.serviciosAgrupados.map((grupo) => {
              const serviciosGrupo = serviciosItems.filter(
                (f) => f.grupo_id === grupo.id
              );
              if (serviciosGrupo.length === 0) return null;

              return (
                <Collapsible
                  key={grupo.id}
                  defaultOpen
                  className="group/grupo rounded-xl border"
                >
                  <CollapsibleTrigger
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="font-medium">{grupo.nombre}</span>
                    <span className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                      {serviciosGrupo.filter((f) => f.seleccionado).length} de{" "}
                      {serviciosGrupo.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="divide-y divide-border/50">
                      {serviciosGrupo.map((servicio) => (
                        <div
                          key={servicio.servicio_id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <Checkbox
                            checked={servicio.seleccionado}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setServiciosItems((prev) =>
                                prev.map((s) =>
                                  s.servicio_id === servicio.servicio_id
                                    ? {
                                        ...s,
                                        seleccionado: checked,
                                        ...(checked ? {} : { frecuencia: null }),
                                      }
                                    : s
                                )
                              );
                            }}
                            aria-label={`Seleccionar ${servicio.nombre}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {servicio.nombre}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {servicio.tipo_personal} ·
                              {servicio.duracion_minutos ?? "—"} min
                            </div>
                          </div>
                          <div className="w-40">
                            <Input
                              type="number"
                              step="any"
                              min={0}
                              value={
                                servicio.frecuencia != null
                                  ? String(servicio.frecuencia)
                                  : ""
                              }
                              onChange={(event) => {
                                const valor = event.target.value;
                                setServiciosItems((prev) =>
                                  prev.map((s) =>
                                    s.servicio_id === servicio.servicio_id
                                      ? {
                                          ...s,
                                          frecuencia:
                                            valor === "" ? null : Number(valor),
                                        }
                                      : s
                                  )
                                );
                              }}
                              placeholder="Freq."
                              disabled={!servicio.seleccionado}
                              className="text-sm"
                              aria-label={`Frecuencia de ${servicio.nombre}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {serviciosSeleccionadosCount === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No hay servicios seleccionados.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-4">
        <BorradorBanner
          pending={formIsSubmitting || precargando}
          mensaje={guardadoMensaje ?? undefined}
        />
        <Button type="submit" disabled={formIsSubmitting} className="px-6">
          {formIsSubmitting ? (
            <>
              <Loader2Icon className="animate-spin mr-2" /> Guardando…
            </>
          ) : (
            <>
              <SaveIcon className="mr-2" /> Guardar borrador
            </>
          )}
        </Button>
      </div>

      {borradorGuardado && !formIsSubmitting && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
          <SaveIcon className="size-4" />
          <span>
            Borrador listo en memoria. Sin envío a base de datos hasta confirmar
            el flujo de persistencia.
          </span>
        </div>
      )}
    </form>
  );
}
