"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockIcon,
  UserIcon,
} from "lucide-react"

import { login } from "@/app/login/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usuario: "", password: "" },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  async function onSubmit(values: LoginInput) {
    setServerError(null)
    const result = await login(values)
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl shadow-foreground/5 ring-foreground/5">
      <CardHeader>
        <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa tu usuario y contraseña para acceder al sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={!!errors.usuario}>
              <FieldLabel htmlFor="usuario">Usuario o correo</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <UserIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id="usuario"
                  placeholder="nombre.apellido"
                  autoComplete="username"
                  aria-invalid={!!errors.usuario}
                  disabled={isSubmitting}
                  {...register("usuario")}
                />
              </InputGroup>
              <FieldError errors={[errors.usuario]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <LockIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  disabled={isSubmitting}
                  {...register("password")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Ingresando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
