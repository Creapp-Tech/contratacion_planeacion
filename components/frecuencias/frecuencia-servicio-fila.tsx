"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  CheckIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import {
  actualizarFrecuenciaServicio,
  eliminarFrecuenciaServicio,
} from "@/app/(dashboard)/frecuencias/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import type { FrecuenciaServicio } from "@/lib/frecuencias/queries"

export function FrecuenciaServicioFila({
  servicio,
}: {
  servicio: FrecuenciaServicio
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [valor, setValor] = useState(String(servicio.frecuencia))
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onGuardar() {
    setError(null)
    startTransition(async () => {
      const result = await actualizarFrecuenciaServicio(servicio.id, {
        frecuencia: valor,
      })
      if ("error" in result) {
        setError(result.error)
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  function onCancelar() {
    setEditing(false)
    setError(null)
    setValor(String(servicio.frecuencia))
  }

  function onEliminar() {
    setError(null)
    startTransition(async () => {
      const result = await eliminarFrecuenciaServicio(servicio.id)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {servicio.servicio_nombre}
        </TableCell>
        <TableCell>
          {editing ? (
            <Input
              type="number"
              step="any"
              min={0}
              className="w-32"
              autoFocus
              value={valor}
              aria-label={`Frecuencia de ${servicio.servicio_nombre}`}
              onChange={(event) => setValor(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onGuardar()
                }
                if (event.key === "Escape") onCancelar()
              }}
            />
          ) : (
            servicio.frecuencia
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Guardar frecuencia"
                  disabled={pending}
                  onClick={onGuardar}
                >
                  {pending ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <CheckIcon />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancelar edición"
                  disabled={pending}
                  onClick={onCancelar}
                >
                  <XIcon />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar frecuencia"
                  onClick={() => {
                    setError(null)
                    setEditing(true)
                  }}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar servicio"
                  onClick={() => {
                    setError(null)
                    setConfirmOpen(true)
                  }}
                >
                  <Trash2Icon />
                </Button>
              </>
            )}
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar servicio</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará «{servicio.servicio_nombre}» de esta frecuencia.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={onEliminar}
                >
                  {pending ? <Loader2Icon className="animate-spin" /> : null}
                  Eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
      {error && editing ? (
        <TableRow>
          <TableCell colSpan={3} className="p-0">
            <Alert variant="destructive" className="m-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
