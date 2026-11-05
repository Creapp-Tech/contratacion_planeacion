"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { crearCups } from "@/app/(dashboard)/configuracion/cups/actions"
import { CupsForm } from "@/components/cups/cups-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NuevoCupsPage() {
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  async function manejarCrear(data: any) {
    const result = await crearCups(data)
    if ("success" in result) {
      setSuccess(true)
    }
    return result
  }

  if (success) {
    return (
      <div className="flex w-full flex-col gap-6">
        <Link
          href="/configuracion/cups"
          className={cn(
            Button,
            { variant: "ghost", size: "sm" },
            "-ml-2 w-fit"
          )}
        >
          <ArrowLeftIcon /> Volver a CUPS
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>CUPS creado correctamente</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.replace("/configuracion/cups")}>
              Ir al listado
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Nuevo CUPS</h1>
          <p className="text-sm text-muted-foreground">
            Completa los datos del CUPS para registrarlo en el catálogo.
          </p>
        </div>
        <Link
          href="/configuracion/cups"
          className={cn(Button, { variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon /> Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del CUPS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CupsForm
            onSubmit={manejarCrear}
            submitting={pending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
