"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { EyeIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react"

import { desactivarUsuario } from "@/app/(dashboard)/usuarios/actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

type UsuarioAccionesProps = {
  id: string
  nombre: string
  estado: string
}

export function UsuarioAcciones({ id, nombre, estado }: UsuarioAccionesProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await desactivarUsuario(id)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/usuarios/${id}`}
        aria-label={`Ver ${nombre}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" })
        )}
      >
        <EyeIcon />
      </Link>
      <Link
        href={`/usuarios/${id}/editar`}
        aria-label={`Editar ${nombre}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" })
        )}
      >
        <PencilIcon />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Desactivar ${nombre}`}
        disabled={estado !== "activo"}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <Trash2Icon />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {nombre} quedará inactivo y no podrá iniciar sesión. Puedes
              reactivarlo editando el usuario.
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
              Desactivar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
