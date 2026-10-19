"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { EyeIcon, Loader2Icon, PencilIcon, PowerIcon } from "lucide-react"

import { cerrarSede } from "@/app/(dashboard)/sedes/actions"
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
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

type SedeAccionesProps = {
  id: string
  nombre: string
  estado: string
}

export function SedeAcciones({ id, nombre, estado }: SedeAccionesProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await cerrarSede(id)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/sedes/${id}`}
        aria-label={`Ver ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <EyeIcon />
      </Link>
      <Link
        href={`/sedes/${id}/editar`}
        aria-label={`Editar ${nombre}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <PencilIcon />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Cerrar ${nombre}`}
        disabled={estado === "inactiva"}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <PowerIcon />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar sede</AlertDialogTitle>
            <AlertDialogDescription>
              Al cerrar la sede queda inactiva y conserva su histórico. Puedes
              reactivarla editando la sede.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : null}
              Cerrar sede
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
