"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { z } from "zod"

import {
  actualizarUsuario,
  crearUsuario,
} from "@/app/(dashboard)/usuarios/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ESTADO_VALUES, ROLES, ROL_VALUES } from "@/lib/constants/roles"
import type { Regional, UsuarioRow } from "@/lib/usuarios/queries"

const SIN_REGIONAL = "__sin_regional__"

const formSchema = z
  .object({
    email: z.string().email("Ingresa un correo válido"),
    nombre_completo: z
      .string()
      .min(3, "Ingresa el nombre completo")
      .max(120, "El nombre es demasiado largo"),
    telefono: z.string().max(30, "El teléfono es demasiado largo"),
    rol: z.enum(ROL_VALUES),
    regional_id: z.string(),
    estado: z.enum(ESTADO_VALUES),
    password: z.string(),
  })
  .refine((data) => data.rol !== "gerente_regional" || !!data.regional_id, {
    message: "La regional es obligatoria para el rol Gerente regional",
    path: ["regional_id"],
  })

type FormValues = z.infer<typeof formSchema>

const ROL_ITEMS = Object.fromEntries(ROLES.map((rol) => [rol.value, rol.label]))

type UsuarioFormProps =
  | { mode: "crear"; regionales: Regional[] }
  | { mode: "editar"; regionales: Regional[]; usuario: UsuarioRow }

export function UsuarioForm(props: UsuarioFormProps) {
  const { mode, regionales } = props
  const usuario = mode === "editar" ? props.usuario : null
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: usuario?.email ?? "",
      nombre_completo: usuario?.nombre_completo ?? "",
      telefono: usuario?.telefono ?? "",
      rol: (usuario?.rol as FormValues["rol"]) ?? "analista_contratacion",
      regional_id: usuario?.regional_id ?? "",
      estado: (usuario?.estado as FormValues["estado"]) ?? "activo",
      password: "",
    },
  })

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form

  const rol = useWatch({ control, name: "rol" })
  const regionalRequerida = rol === "gerente_regional"

  const regionalItems = Object.fromEntries([
    [SIN_REGIONAL, "Sin regional"],
    ...regionales.map((regional) => [regional.id, regional.nombre]),
  ])

  async function onSubmit(values: FormValues) {
    setServerError(null)

    if (mode === "crear" && values.password.length < 8) {
      setError("password", {
        message: "La contraseña debe tener al menos 8 caracteres",
      })
      return
    }

    const base = {
      nombre_completo: values.nombre_completo,
      telefono: values.telefono || undefined,
      rol: values.rol,
      regional_id: values.regional_id || null,
      estado: values.estado,
    }

    const result =
      mode === "crear"
        ? await crearUsuario({
            ...base,
            email: values.email,
            password: values.password,
          })
        : await actualizarUsuario(props.usuario.id, {
            ...base,
            password: values.password || undefined,
          })

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    router.push("/usuarios")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Correo</FieldLabel>
          {mode === "crear" ? (
            <Input
              id="email"
              type="email"
              autoComplete="off"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          ) : (
            <Input id="email" type="email" value={usuario?.email ?? ""} disabled />
          )}
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.nombre_completo}>
          <FieldLabel htmlFor="nombre_completo">Nombre completo</FieldLabel>
          <Input
            id="nombre_completo"
            autoComplete="off"
            aria-invalid={!!errors.nombre_completo}
            {...register("nombre_completo")}
          />
          <FieldError errors={[errors.nombre_completo]} />
        </Field>

        <Field data-invalid={!!errors.telefono}>
          <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
          <Input
            id="telefono"
            autoComplete="off"
            aria-invalid={!!errors.telefono}
            {...register("telefono")}
          />
          <FieldError errors={[errors.telefono]} />
        </Field>

        <Field data-invalid={!!errors.rol}>
          <FieldLabel htmlFor="rol">Rol</FieldLabel>
          <Controller
            control={control}
            name="rol"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                items={ROL_ITEMS}
              >
                <SelectTrigger
                  id="rol"
                  className="w-full"
                  aria-invalid={!!errors.rol}
                >
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value}>
                      {rol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.rol]} />
        </Field>

        <Field data-invalid={!!errors.regional_id}>
          <FieldLabel htmlFor="regional">Regional</FieldLabel>
          <Controller
            control={control}
            name="regional_id"
            render={({ field }) => (
              <Select
                value={field.value || SIN_REGIONAL}
                onValueChange={(value) =>
                  field.onChange(value === SIN_REGIONAL ? "" : value)
                }
                items={regionalItems}
              >
                <SelectTrigger
                  id="regional"
                  className="w-full"
                  aria-invalid={!!errors.regional_id}
                >
                  <SelectValue placeholder="Selecciona una regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_REGIONAL}>Sin regional</SelectItem>
                  {regionales.map((regional) => (
                    <SelectItem key={regional.id} value={regional.id}>
                      {regional.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldDescription>
            {regionalRequerida
              ? "Obligatoria para el rol Gerente regional."
              : "Opcional. Define la regional del usuario."}
          </FieldDescription>
          <FieldError errors={[errors.regional_id]} />
        </Field>

        {mode === "editar" ? (
          <Field orientation="horizontal">
            <FieldLabel htmlFor="estado">Activo</FieldLabel>
            <Controller
              control={control}
              name="estado"
              render={({ field }) => (
                <Switch
                  id="estado"
                  checked={field.value === "activo"}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? "activo" : "inactivo")
                  }
                />
              )}
            />
            <FieldDescription>
              Desactiva el usuario para impedir su acceso.
            </FieldDescription>
          </Field>
        ) : null}

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">
            {mode === "crear" ? "Contraseña" : "Nueva contraseña"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {mode === "editar" ? (
            <FieldDescription>
              Déjala vacía para conservar la contraseña actual.
            </FieldDescription>
          ) : null}
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "crear" ? "Crear usuario" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
