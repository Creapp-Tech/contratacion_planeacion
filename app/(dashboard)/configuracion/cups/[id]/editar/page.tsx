"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "cn"

import { getCups } from "@/lib/cups/queries"
import { actualizarCups } from "@/app/(dashboard)/configuracion/cups/actions"
import { CupsForm } from "@/components/cups/cups-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface EditarCupsPageProps {
  params: Promise<{ id: string }>
}

export default function EditarCupsPage({
  params,
}: EditarCupsPageProps) {
  const [pending, startTransition] = useTransition()
  const [cup, setCup] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  async function loadCup() {
    const { id } = await params
    const data = await getCups(id)
    setCup(data ?? null)
  }

  loadCup()

  async function manejarActualizar(data: any) {
    const { id } = await params
    const result = await actualizarCups(id, data)
    if ("success" in result) {
      setSuccess(true)
    }
    return result
  }

  if (!cup) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    )
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
            <CardTitle>CUPS actualizado correctamente</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.replace("/configuracion/cups")}
            >
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
          <h1 className="font-heading text-2xl font-semibold">Editar CUPS</h1>
          <p className="text-sm text-muted-foreground">
            Modifica los datos del CUPS {cup.codigo}.
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
            initialData={cup}
            onSubmit={manejarActualizar}
            submitting={pending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
