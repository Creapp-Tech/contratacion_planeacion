"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { actualizarCups } from "@/app/(dashboard)/configuracion/cups/actions"
import type { CupsRow } from "@/lib/cups/queries"
import type { CupsInput } from "@/lib/validations/cups"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { CupsForm } from "./cups-form"

export function CupEditarForm({ cup }: { cup: CupsRow }) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  async function manejarActualizar(data: CupsInput) {
    const result = await actualizarCups(cup.id, data)
    if ("success" in result) {
      setSuccess(true)
      router.refresh()
    }
    return result
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CUPS actualizado correctamente</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/configuracion/cups")}>
            Ir al listado
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <CupsForm initialData={cup} onSubmit={manejarActualizar} />
}
